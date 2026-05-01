import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserX,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  Hash,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { appointmentAPI, BackendAppointment } from '../services/api';
import { toast } from 'sonner';

/**
 * Represents a single status change event in the appointment lifecycle.
 * Since the frontend currently uses mock data without a real status history,
 * we derive a plausible timeline from the appointment's current status.
 */
interface StatusEvent {
  status: string;
  label: string;
  timestamp: string;
  description: string;
  reached: boolean;
  isCurrent: boolean;
}

/** Ordered list of statuses in the normal appointment lifecycle. */
const STATUS_FLOW = ['pending', 'confirmed', 'completed'] as const;

/** Terminal statuses that branch off the normal flow. */
const TERMINAL_STATUSES: Record<string, { label: string; description: string }> = {
  cancelled: { label: 'Cancelled', description: 'Appointment was cancelled' },
  no_show: { label: 'No Show', description: 'Client did not attend the appointment' },
};

const STATUS_META: Record<string, { label: string; description: string }> = {
  pending: { label: 'Pending', description: 'Appointment request submitted' },
  confirmed: { label: 'Confirmed', description: 'Appointment confirmed by staff' },
  completed: { label: 'Completed', description: 'Appointment completed successfully' },
  ...TERMINAL_STATUSES,
};

function getStatusIcon(status: string, reached: boolean) {
  const iconClass = reached ? 'text-white' : 'text-gray-400';
  const size = 20;

  switch (status) {
    case 'pending':
      return <Clock size={size} className={iconClass} />;
    case 'confirmed':
      return <CheckCircle2 size={size} className={iconClass} />;
    case 'completed':
      return <CheckCircle2 size={size} className={iconClass} />;
    case 'cancelled':
      return <XCircle size={size} className={iconClass} />;
    case 'no_show':
      return <UserX size={size} className={iconClass} />;
    default:
      return <AlertCircle size={size} className={iconClass} />;
  }
}

function getStatusBgColor(status: string, reached: boolean): string {
  if (!reached) return 'bg-gray-200';

  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'confirmed':
      return 'bg-green-500';
    case 'completed':
      return 'bg-blue-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'no_show':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
    case 'confirmed':
      return 'default';
    case 'cancelled':
    case 'no_show':
      return 'destructive';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Derives a status timeline from the appointment's current status and creation date.
 * In a real implementation this would come from the backend's status history table.
 */
function buildTimeline(appointment: BackendAppointment): StatusEvent[] {
  const currentStatus = appointment.status;
  const createdAt = new Date(appointment.createdAt);
  const events: StatusEvent[] = [];

  const isTerminal = currentStatus in TERMINAL_STATUSES;

  // Determine how far along the normal flow we are
  const normalIndex = (STATUS_FLOW as readonly string[]).indexOf(currentStatus);
  const reachedIndex = isTerminal
    ? (STATUS_FLOW as readonly string[]).indexOf('confirmed') // terminal statuses happen after confirmed at most
    : normalIndex;

  // Build normal flow events
  STATUS_FLOW.forEach((status, index) => {
    const reached = index <= reachedIndex;
    const isCurrent = !isTerminal && status === currentStatus;

    // Simulate timestamps: each step is ~1 day after the previous
    const eventDate = new Date(createdAt);
    eventDate.setDate(eventDate.getDate() + index);

    events.push({
      status,
      label: STATUS_META[status].label,
      timestamp: reached ? eventDate.toISOString() : '',
      description: STATUS_META[status].description,
      reached,
      isCurrent,
    });
  });

  // If the appointment ended in a terminal status, add it
  if (isTerminal) {
    const terminalDate = new Date(createdAt);
    terminalDate.setDate(terminalDate.getDate() + reachedIndex + 1);

    events.push({
      status: currentStatus,
      label: STATUS_META[currentStatus]?.label ?? currentStatus,
      timestamp: terminalDate.toISOString(),
      description: STATUS_META[currentStatus]?.description ?? '',
      reached: true,
      isCurrent: true,
    });
  }

  return events;
}

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<BackendAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!id) return;
      try {
        const data = await appointmentAPI.getById(id);
        if (!data) {
          toast.error('Appointment not found');
          navigate('/appointments', { replace: true });
          return;
        }
        setAppointment(data);
      } catch (error) {
        toast.error('Failed to load appointment details');
        navigate('/appointments', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadAppointment();
  }, [id, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-500 text-lg">Loading appointment details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-500 text-lg">Appointment not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const timeline = buildTimeline(appointment);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/appointments')}
            aria-label="Back to appointments"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[var(--gov-secondary)]">
              Appointment Details
            </h1>
            <p className="text-sm text-gray-500">
              Tracking Number: {appointment.trackingNumber}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-sm px-3 py-1">
            {STATUS_META[appointment.status]?.label ?? appointment.status}
          </Badge>
        </div>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative" role="list" aria-label="Appointment status timeline">
              {timeline.map((event, index) => {
                const isLast = index === timeline.length - 1;

                return (
                  <div
                    key={event.status}
                    className="flex gap-4 pb-6 last:pb-0"
                    role="listitem"
                    aria-current={event.isCurrent ? 'step' : undefined}
                  >
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getStatusBgColor(
                          event.status,
                          event.reached,
                        )}`}
                      >
                        {getStatusIcon(event.status, event.reached)}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 mt-2 ${
                            event.reached ? 'bg-gray-300' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>

                    {/* Event details */}
                    <div className="pt-1.5 min-w-0">
                      <p
                        className={`font-medium ${
                          event.reached ? 'text-gray-900' : 'text-gray-400'
                        } ${event.isCurrent ? 'text-[var(--gov-primary)]' : ''}`}
                      >
                        {event.label}
                        {event.isCurrent && (
                          <span className="ml-2 text-xs font-normal text-[var(--gov-primary)]">
                            (Current)
                          </span>
                        )}
                      </p>
                      <p className={`text-sm ${event.reached ? 'text-gray-600' : 'text-gray-400'}`}>
                        {event.description}
                      </p>
                      {event.reached && event.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service & Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium">{appointment.serviceId}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(appointment.dateTime).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Clock size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{new Date(appointment.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Hash size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-medium text-[var(--gov-primary)]">
                    {appointment.trackingNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{appointment.personalDetails.firstName} {appointment.personalDetails.lastName}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{appointment.personalDetails.email}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{appointment.personalDetails.phoneNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Remarks / Notes */}
        {appointment.remarks && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{appointment.remarks}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">
            Created: {new Date(appointment.createdAt).toLocaleString()}
          </p>
          <Button variant="outline" onClick={() => navigate('/appointments')}>
            Back to Appointments
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
