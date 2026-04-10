import { Clock, CheckCircle, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/Card';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { INITIAL_APPOINTMENTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export function StaffDashboard() {
  const { user } = useAuth();
  const appointments = INITIAL_APPOINTMENTS;

  const stats = {
    today: appointments.filter(a => a.date === '2026-03-11').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  // Dynamic content based on user role
  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrator Dashboard';
      case 'manager':
        return 'Manager Dashboard';
      case 'staff':
        return 'Staff Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getDashboardDescription = () => {
    switch (user?.role) {
      case 'admin':
        return 'Overview of system-wide appointment statistics and data';
      case 'manager':
        return 'Manage services, staff, and oversee appointment operations';
      case 'staff':
        return 'Process and manage appointment requests';
      default:
        return 'Manage appointments';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">
            {getDashboardTitle()} - Welcome, {user?.name}!
          </h1>
          <p className="text-gray-600">{getDashboardDescription()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Appointments"
            value={stats.today}
            icon={<Calendar size={24} />}
            color="var(--gov-primary)"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={<Clock size={24} />}
            color="#eab308"
          />
          <StatCard
            title="Confirmed"
            value={stats.confirmed}
            icon={<CheckCircle size={24} />}
            color="#3b82f6"
          />
          <StatCard
            title="Completed Today"
            value={stats.completed}
            icon={<Users size={24} />}
            color="#10b981"
          />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-[var(--gov-secondary)]">Pending Appointment Requests</h2>
            <Link to="/process" className="text-[var(--gov-primary)] text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Tracking Number</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Client Name</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Service</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.filter(a => a.status === 'pending').map(appointment => (
                  <tr key={appointment.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm">{appointment.trackingNumber}</td>
                    <td className="py-3 px-4 text-sm">{appointment.clientName}</td>
                    <td className="py-3 px-4 text-sm">{appointment.service}</td>
                    <td className="py-3 px-4 text-sm">{new Date(appointment.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm">{appointment.time}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm">Approve</Button>
                        <Button variant="destructive" size="sm">Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl text-[var(--gov-secondary)] mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            {appointments.filter(a => a.status === 'confirmed').slice(0, 5).map(appointment => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--gov-primary)] rounded-lg flex items-center justify-center text-white">
                    {appointment.time.split(':')[0]}
                    <span className="text-xs">{appointment.time.includes('AM') ? 'AM' : 'PM'}</span>
                  </div>
                  <div>
                    <h3 className="text-[var(--gov-secondary)]">{appointment.service}</h3>
                    <p className="text-sm text-gray-600">{appointment.clientName}</p>
                  </div>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}