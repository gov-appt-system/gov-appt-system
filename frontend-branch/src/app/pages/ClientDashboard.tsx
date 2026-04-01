import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/Card';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { appointmentAPI, Appointment } from '../services/api';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export function ClientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const notifications = INITIAL_NOTIFICATIONS;

  // Load appointments on mount
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

  const stats = {
    upcoming: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Welcome Back, {user?.name}!</h1>
          <p className="text-gray-600">Manage your government service appointments</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Upcoming Appointments"
            value={stats.upcoming}
            icon={<Calendar size={24} />}
            color="var(--gov-primary)"
          />
          <StatCard
            title="Pending Requests"
            value={stats.pending}
            icon={<Clock size={24} />}
            color="#eab308"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle size={24} />}
            color="#3b82f6"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={<XCircle size={24} />}
            color="var(--gov-alert)"
          />
        </div>

        {/* Quick Actions 
        <Card className="p-6">
          <h2 className="text-xl text-[var(--gov-secondary)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/book">
              <Button className="w-full justify-center bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90">
                <CalendarPlus size={20} className="mr-2" />
                Book New Appointment
              </Button>
            </Link>
            <Link to="/track">
              <Button variant="outline" className="w-full justify-center">
                <Search size={20} className="mr-2" />
                Track Appointment
              </Button>
            </Link>
          </div>
        </Card> */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-[var(--gov-secondary)]">Recent Appointments</h2>
              <Link to="/appointments" className="text-[var(--gov-primary)] text-sm hover:underline">
                View All
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 3).map(appointment => (
                  <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">{appointment.trackingNumber}</p>
                        <h3 className="text-[var(--gov-secondary)]">{appointment.service}</h3>
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(appointment.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {appointment.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-[var(--gov-secondary)]">Notifications</h2>
              <Link to="/notifications" className="text-[var(--gov-primary)] text-sm hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className="p-4 bg-[var(--gov-highlight)] rounded-lg">
                  <p className="text-sm text-gray-700">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Mini Calendar */}
        <Card className="p-6">
          <h2 className="text-xl text-[var(--gov-secondary)] mb-4">Upcoming Schedule</h2>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-sm text-gray-600 py-2">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2; // Start from day -2 to fill the calendar
              const hasAppointment = day === 15 || day === 20; // Mock appointment days
              return (
                <div
                  key={i}
                  className={`py-2 text-sm rounded-lg ${
                    day < 1 || day > 31
                      ? 'text-gray-300'
                      : hasAppointment
                      ? 'bg-[var(--gov-primary)] text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {day > 0 && day <= 31 ? day : ''}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}