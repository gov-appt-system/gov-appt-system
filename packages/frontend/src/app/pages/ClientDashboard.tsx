import { useState, useEffect } from 'react';
import { Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/StatusBadge';
import { appointmentAPI, Appointment } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export function ClientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await appointmentAPI.getAll();
        setAppointments(data);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, []);

  // Calendar logic
  const today = new Date();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const appointmentDates = new Set(
    appointments.map(a => {
      const d = new Date(a.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  return (
    <DashboardLayout>
      <div className="space-y-8">
 
        {/* Appointments + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Appointments List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-[var(--gov-secondary)]">Appointments</h2>
              <Link
                to="/appointments"
                className="text-[var(--gov-primary)] text-sm hover:underline"
              >
                View All
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No appointments yet.</div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 3).map(appointment => {
                  const aptDate = new Date(appointment.date);
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl"
                    >
                      {/* Date Badge */}
                      <div className="flex-shrink-0 bg-[var(--gov-primary)]/20 rounded-xl px-3 py-2 text-center min-w-[56px]">
                        <p className="text-2xl font-semibold text-[var(--gov-secondary)] leading-none">
                          {String(aptDate.getDate()).padStart(2, '0')}
                        </p>
                        <p className="text-xs text-[var(--gov-primary)] font-medium mt-1">
                          {MONTH_SHORT[aptDate.getMonth()]}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="text-sm font-medium text-[var(--gov-secondary)]">
                              {appointment.service}
                            </h3>
                            <p className="text-xs text-gray-400">{appointment.trackingNumber}</p>
                          </div>
                          <StatusBadge status={appointment.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {appointment.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {'location' in appointment
                              ? (appointment as any).location
                              : 'Pasay City'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Live Calendar */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-[var(--gov-secondary)]">Calendar</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center mb-3">
              {MONTH_NAMES[month]} {year}
            </p>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-xs text-gray-400 py-1">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();
                const hasApt = appointmentDates.has(`${year}-${month}-${day}`);
                return (
                  <div
                    key={day}
                    className={`
                      mx-auto w-8 h-8 flex items-center justify-center text-xs rounded-lg
                      ${isToday
                        ? 'bg-[var(--gov-primary)] text-white font-semibold'
                        : hasApt
                        ? 'bg-[var(--gov-primary)]/20 text-[var(--gov-secondary)] font-semibold'
                        : 'hover:bg-gray-100 text-gray-600'}
                    `}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-[var(--gov-primary)]" />
                Today
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded bg-[var(--gov-primary)]/20" />
                Has appointment
              </div>
            </div>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}