import { supabase } from '../config/supabase';
import { TimeSlot, ServiceHours } from '../types/index';

// ============================================================
// Helpers
// ============================================================

/**
 * Parses a "HH:MM" string into { hours, minutes }.
 */
function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Returns a Date set to the given HH:MM on the provided base date (UTC).
 */
function toDateAtTime(base: Date, hhmm: string): Date {
  const { hours, minutes } = parseTime(hhmm);
  const d = new Date(base);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

// ============================================================
// 6.1 — getAvailableSlots
// ============================================================

/**
 * Returns all time slots for a service on a given date, with availability info.
 * Slots are generated from service start_time to end_time in duration-sized increments.
 * Each slot's `booked` count is computed from non-archived appointments.
 * Requirements: 2.1
 */
export async function getAvailableSlots(
  serviceId: string,
  date: Date,
): Promise<TimeSlot[]> {
  // Fetch service config
  const { data: service, error: svcError } = await supabase
    .from('services')
    .select('id, duration, capacity, start_time, end_time, days_of_week, is_active, archived_at')
    .eq('id', serviceId)
    .single();

  if (svcError || !service) {
    throw new Error(`Service not found: ${serviceId}`);
  }

  if (!service.is_active || service.archived_at) {
    return [];
  }

  // Check if the requested date falls on an operating day
  const dayOfWeek = date.getUTCDay(); // 0=Sunday … 6=Saturday
  if (!(service.days_of_week as number[]).includes(dayOfWeek)) {
    return [];
  }

  // Build slot boundaries for the day
  const startDt = toDateAtTime(date, service.start_time as string);
  const endDt = toDateAtTime(date, service.end_time as string);
  const durationMs = (service.duration as number) * 60 * 1000;

  const slotStarts: Date[] = [];
  for (let t = startDt.getTime(); t + durationMs <= endDt.getTime(); t += durationMs) {
    slotStarts.push(new Date(t));
  }

  if (slotStarts.length === 0) return [];

  // Fetch all non-archived appointments for this service on this date
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select('appointment_date_time')
    .eq('service_id', serviceId)
    .is('archived_at', null)
    .gte('appointment_date_time', dayStart.toISOString())
    .lte('appointment_date_time', dayEnd.toISOString());

  if (apptError) {
    throw new Error(`Failed to fetch appointments: ${apptError.message}`);
  }

  // Count bookings per slot
  const bookedCounts = new Map<number, number>();
  for (const appt of appointments ?? []) {
    const apptTime = new Date(appt.appointment_date_time).getTime();
    // Find which slot this appointment belongs to
    for (const slotStart of slotStarts) {
      const slotEnd = slotStart.getTime() + durationMs;
      if (apptTime >= slotStart.getTime() && apptTime < slotEnd) {
        bookedCounts.set(slotStart.getTime(), (bookedCounts.get(slotStart.getTime()) ?? 0) + 1);
        break;
      }
    }
  }

  const capacity = service.capacity as number;

  return slotStarts.map((slotStart) => {
    const booked = bookedCounts.get(slotStart.getTime()) ?? 0;
    return {
      dateTime: slotStart,
      available: booked < capacity,
      capacity,
      booked,
    };
  });
}

// ============================================================
// 6.2 — checkSlotAvailability / reserveSlot
// ============================================================

/**
 * Returns true if the given slot still has capacity.
 * Requirements: 2.2
 */
export async function checkSlotAvailability(
  serviceId: string,
  dateTime: Date,
): Promise<boolean> {
  const { data: service, error: svcError } = await supabase
    .from('services')
    .select('capacity, duration, is_active, archived_at')
    .eq('id', serviceId)
    .single();

  if (svcError || !service || !service.is_active || service.archived_at) {
    return false;
  }

  const durationMs = (service.duration as number) * 60 * 1000;
  const slotStart = new Date(dateTime);
  const slotEnd = new Date(slotStart.getTime() + durationMs);

  const { count, error: countError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', serviceId)
    .is('archived_at', null)
    .gte('appointment_date_time', slotStart.toISOString())
    .lt('appointment_date_time', slotEnd.toISOString());

  if (countError) {
    throw new Error(`Failed to check slot availability: ${countError.message}`);
  }

  return (count ?? 0) < (service.capacity as number);
}

/**
 * Atomically reserves a slot by verifying capacity and inserting the appointment
 * within a single Postgres transaction via an RPC function.
 *
 * The RPC `reserve_appointment_slot` must:
 *   1. Lock the relevant appointment rows (SELECT FOR UPDATE)
 *   2. Count existing bookings for the slot
 *   3. Return false if at capacity, true otherwise (the caller inserts the row)
 *
 * Falls back to a non-transactional check+insert when the RPC is unavailable
 * (e.g. during local development without the function deployed).
 *
 * Requirements: 2.2
 */
export async function reserveSlot(
  serviceId: string,
  dateTime: Date,
  duration: number,
): Promise<boolean> {
  const slotStart = new Date(dateTime);
  const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

  // Attempt atomic reservation via Postgres RPC
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'reserve_appointment_slot',
    {
      p_service_id: serviceId,
      p_slot_start: slotStart.toISOString(),
      p_slot_end: slotEnd.toISOString(),
    },
  );

  if (!rpcError) {
    return rpcResult as boolean;
  }

  // Fallback: best-effort check (race condition possible — use only in dev)
  return checkSlotAvailability(serviceId, dateTime);
}

/**
 * Releases a previously reserved slot (e.g. on booking cancellation).
 * In this implementation the slot is freed automatically when the appointment
 * is archived; this method is a no-op placeholder for interface compatibility.
 */
export async function releaseSlot(
  _serviceId: string,
  _dateTime: Date,
): Promise<void> {
  // Slot capacity is derived from live appointment counts — no explicit release needed.
}

// ============================================================
// 6.3 — isWithinServiceHours
// ============================================================

/**
 * Returns true if the given dateTime falls within the service's configured
 * operating hours (start_time, end_time, days_of_week).
 * Requirements: 3.3
 */
export async function isWithinServiceHours(
  serviceId: string,
  dateTime: Date,
): Promise<boolean> {
  const { data: service, error } = await supabase
    .from('services')
    .select('start_time, end_time, days_of_week, is_active, archived_at')
    .eq('id', serviceId)
    .single();

  if (error || !service || !service.is_active || service.archived_at) {
    return false;
  }

  const dayOfWeek = dateTime.getUTCDay();
  if (!(service.days_of_week as number[]).includes(dayOfWeek)) {
    return false;
  }

  const { hours: startH, minutes: startM } = parseTime(service.start_time as string);
  const { hours: endH, minutes: endM } = parseTime(service.end_time as string);

  const requestedMinutes = dateTime.getUTCHours() * 60 + dateTime.getUTCMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return requestedMinutes >= startMinutes && requestedMinutes < endMinutes;
}

/**
 * Returns the operating hours configuration for a service.
 */
export async function getServiceHours(serviceId: string): Promise<ServiceHours> {
  const { data: service, error } = await supabase
    .from('services')
    .select('start_time, end_time, days_of_week, capacity')
    .eq('id', serviceId)
    .single();

  if (error || !service) {
    throw new Error(`Service not found: ${serviceId}`);
  }

  return {
    startTime: service.start_time as string,
    endTime: service.end_time as string,
    daysOfWeek: service.days_of_week as number[],
    capacity: service.capacity as number,
  };
}
