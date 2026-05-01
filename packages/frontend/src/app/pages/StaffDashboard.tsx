import { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, Users, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';
import { appointmentAPI, serviceAPI, adminAPI, BackendAppointment, BackendService, StaffAccount, ClientAccount } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function StaffDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<BackendAppointment[]>([]);
  const [services, setServices] = useState<BackendService[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (isAdmin) {
          // Admin: fetch accounts and services (no appointment access)
          const [staff, clients, svcs] = await Promise.all([
            adminAPI.getAccounts(),
            adminAPI.getClients(),
            serviceAPI.getAll().catch(() => [] as BackendService[]),
          ]);
          setStaffAccounts(staff);
          setClientAccounts(clients);
          setServices(svcs);
        } else {
          // Staff/Manager: fetch appointments and services
          const [appts, svcs] = await Promise.all([
            appointmentAPI.getAll(),
            serviceAPI.getAll(),
          ]);
          setAppointments(appts);
          setServices(svcs);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAdmin]);

  // Build a serviceId → name lookup
  const serviceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of services) {
      map[s.id] = s.name;
    }
    return map;
  }, [services]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Stats for staff/manager
  const appointmentStats = useMemo(() => ({
    today: appointments.filter(a => a.dateTime?.slice(0, 10) === todayStr).length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  }), [appointments, todayStr]);

  // Stats for admin
  const adminStats = useMemo(() => ({
    totalStaff: staffAccounts.filter(a => a.role === 'staff').length,
    totalManagers: staffAccounts.filter(a => a.role === 'manager').length,
    totalClients: clientAccounts.length,
    activeServices: services.length,
  }), [staffAccounts, clientAccounts, services]);

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'admin': return 'Administrator Dashboard';
      case 'manager': return 'Manager Dashboard';
      case 'staff': return 'Staff Dashboard';
      default: return 'Dashboard';
    }
  };

  const getDashboardDescription = () => {
    switch (user?.role) {
      case 'admin': return 'Overview of system-wide appointment statistics and data';
      case 'manager': return 'Manage services, staff, and oversee appointment operations';
      case 'staff': return 'Process and manage appointment requests';
      default: return 'Manage appointments';
    }
  };

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading dashboard…</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">
            {getDashboardTitle()} - Welcome, {user?.name}!
          </h1>
          <p className="text-gray-600">{getDashboardDescription()}</p>
        </div>

        {/* Stat cards */}
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Staff Accounts', value: adminStats.totalStaff, icon: <Users size={24} />, color: 'var(--gov-primary)' },
              { title: 'Manager Accounts', value: adminStats.totalManagers, icon: <CheckCircle size={24} />, color: '#3b82f6' },
              { title: 'Client Accounts', value: adminStats.totalClients, icon: <Users size={24} />, color: '#10b981' },
              { title: 'Active Services', value: adminStats.activeServices, icon: <Calendar size={24} />, color: '#eab308' },
            ].map((stat) => (
              <Card key={stat.title} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                    <div style={{ color: stat.color }}>{stat.icon}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Today's Appointments", value: appointmentStats.today, icon: <Calendar size={24} />, color: 'var(--gov-primary)' },
              { title: 'Pending Approval', value: appointmentStats.pending, icon: <Clock size={24} />, color: '#eab308' },
              { title: 'Confirmed', value: appointmentStats.confirmed, icon: <CheckCircle size={24} />, color: '#3b82f6' },
              { title: 'Completed', value: appointmentStats.completed, icon: <Users size={24} />, color: '#10b981' },
            ].map((stat) => (
              <Card key={stat.title} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                    <div style={{ color: stat.color }}>{stat.icon}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Admin: Quick Links */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-[var(--gov-secondary)]">Account Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin/accounts">
                  <Button variant="outline" className="w-full justify-start">Staff & Manager Accounts</Button>
                </Link>
                <Link to="/admin/clients">
                  <Button variant="outline" className="w-full justify-start">Client Accounts</Button>
                </Link>
                <Link to="/staff">
                  <Button variant="outline" className="w-full justify-start">Staff Management</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-[var(--gov-secondary)]">System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin/audit-logs">
                  <Button variant="outline" className="w-full justify-start">Audit Logs</Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" className="w-full justify-start">Service Management</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Staff/Manager: Pending Appointment Requests */}
        {!isAdmin && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-xl text-[var(--gov-secondary)]">
              Pending Appointment Requests
            </CardTitle>
            <Link to="/process" className="text-[var(--gov-primary)] text-sm hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {pendingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No pending appointments.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAppointments.slice(0, 5).map(appt => (
                    <TableRow key={appt.id}>
                      <TableCell className="text-sm">{appt.trackingNumber}</TableCell>
                      <TableCell className="text-sm">
                        {appt.personalDetails.firstName} {appt.personalDetails.lastName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {serviceNameMap[appt.serviceId] || appt.serviceId}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(appt.dateTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={appt.status} />
                      </TableCell>
                      <TableCell>
                        <Link to="/process">
                          <Button variant="default" size="sm">Process</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        )}

        {/* Staff/Manager: Today's Schedule */}
        {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-[var(--gov-secondary)]">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {confirmedAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No confirmed appointments.</p>
            ) : (
              <div className="space-y-3">
                {confirmedAppointments.slice(0, 5).map(appt => {
                  const dt = new Date(appt.dateTime);
                  const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={appt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--gov-primary)] rounded-lg flex items-center justify-center text-white text-sm font-medium">
                          {timeStr}
                        </div>
                        <div>
                          <h3 className="text-[var(--gov-secondary)]">
                            {serviceNameMap[appt.serviceId] || appt.serviceId}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {appt.personalDetails.firstName} {appt.personalDetails.lastName}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
