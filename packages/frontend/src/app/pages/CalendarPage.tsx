import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { appointmentAPI, BackendAppointment } from '../services/api';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<BackendAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await appointmentAPI.getAll();
        setAppointments(data);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (null | { day: number; date: string; appointments: BackendAppointment[] })[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.dateTime);
        const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
        return aptDateStr === dateStr;
      });
      days.push({ day, date: dateStr, appointments: dayAppointments });
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Appointment Calendar</h1>
          <p className="text-gray-600">View all scheduled appointments</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl text-[var(--gov-secondary)]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft size={20} />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading calendar...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm text-gray-600 py-3">
                  {day}
                </div>
              ))}

              {getDaysInMonth(currentDate).map((dayInfo, index) => {
                if (!dayInfo) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                return (
                  <div
                    key={dayInfo.date}
                    className="aspect-square border border-gray-200 rounded-lg p-2 hover:border-[var(--gov-primary)] transition-colors"
                  >
                    <div className="text-sm mb-1">{dayInfo.day}</div>
                    <div className="space-y-1">
                      {dayInfo.appointments.slice(0, 2).map((apt) => {
                        const aptTime = new Date(apt.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        return (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded truncate ${
                              apt.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : apt.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : apt.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {aptTime} - {apt.serviceId.substring(0, 15)}
                          </div>
                        );
                      })}
                      {dayInfo.appointments.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayInfo.appointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Legend */}
        <Card className="p-6">
          <h3 className="text-lg text-[var(--gov-secondary)] mb-4">Status Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100" />
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100" />
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
