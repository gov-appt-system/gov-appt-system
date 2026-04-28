import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  Shield,
  Activity,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
}

/* ------------------------------------------------------------------ */
/*  Mock data helpers                                                  */
/* ------------------------------------------------------------------ */

function daysAgo(days: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/*  Initial mock audit log entries (~25 entries, last 7 days)          */
/* ------------------------------------------------------------------ */

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: daysAgo(0, 9, 15),
    userId: 'usr-admin-1',
    userName: 'Admin User',
    userEmail: 'admin@gov.ph',
    action: 'Login',
    resource: 'Auth',
    details: { method: 'email_password' },
    ipAddress: '192.168.1.10',
  },
  {
    id: 'log-002',
    timestamp: daysAgo(0, 9, 45),
    userId: 'usr-admin-1',
    userName: 'Admin User',
    userEmail: 'admin@gov.ph',
    action: 'Create',
    resource: 'User Account',
    details: { targetRole: 'staff', targetEmail: 'new.staff@gov.ph' },
    ipAddress: '192.168.1.10',
  },
  {
    id: 'log-003',
    timestamp: daysAgo(0, 10, 30),
    userId: 'usr-staff-1',
    userName: 'Maria Staff',
    userEmail: 'staff@gov.ph',
    action: 'Login',
    resource: 'Auth',
    details: { method: 'email_password' },
    ipAddress: '192.168.1.20',
  },
  {
    id: 'log-004',
    timestamp: daysAgo(0, 11, 0),
    userId: 'usr-staff-1',
    userName: 'Maria Staff',
    userEmail: 'staff@gov.ph',
    action: 'Update',
    resource: 'Appointment',
    details: { appointmentId: 'apt-101', oldStatus: 'pending', newStatus: 'confirmed' },
    ipAddress: '192.168.1.20',
  },
  {
    id: 'log-005',
    timestamp: daysAgo(0, 14, 20),
    userId: 'usr-staff-1',
    userName: 'Maria Staff',
    userEmail: 'staff@gov.ph',
    action: 'Logout',
    resource: 'Auth',
    details: {},
    ipAddress: '192.168.1.20',
  },
  {
    id: 'log-006',
    timestamp: daysAgo(1, 8, 0),
    userId: null,
    userName: null,
    userEmail: null,
    action: 'System Event',
    resource: 'Auth',
    details: { event: 'session_cleanup', expiredSessions: 12 },
    ipAddress: null,
  },
  {
    id: 'log-007',
    timestamp: daysAgo(1, 9, 10),
    userId: 'usr-manager-1',
    userName: 'Carlos Manager',
    userEmail: 'manager@gov.ph',
    action: 'Login',
    resource: 'Auth',
    details: { method: 'email_password' },
    ipAddress: '192.168.1.30',
  },
  {
    id: 'log-008',
    timestamp: daysAgo(1, 10, 0),
    userId: 'usr-manager-1',
    userName: 'Carlos Manager',
    userEmail: 'manager@gov.ph',
    action: 'Create',
    resource: 'Service',
    details: { serviceName: 'Birth Certificate', department: 'Civil Registry' },
    ipAddress: '192.168.1.30',
  },
  {
    id: 'log-009',
    timestamp: daysAgo(1, 10, 45),
    userId: 'usr-manager-1',
    userName: 'Carlos Manager',
    userEmail: 'manager@gov.ph',
    action: 'Update',
    resource: 'Service',
    details: { serviceName: 'Birth Certificate', field: 'capacity', oldValue: 5, newValue: 10 },
    ipAddress: '192.168.1.30',
  },
  {
    id: 'log-010',
    timestamp: daysAgo(1, 11, 30),
    userId: 'usr-manager-1',
    userName: 'Carlos Manager',
    userEmail: 'manager@gov.ph',
    action: 'Create',
    resource: 'Staff Assignment',
    details: { staffEmail: 'staff@gov.ph', serviceName: 'Birth Certificate' },
    ipAddress: '192.168.1.30',
  },
  {
    id: 'log-011',
    timestamp: daysAgo(2, 8, 30),
    userId: 'usr-admin-1',
    userName: 'Admin User',
    userEmail: 'admin@gov.ph',
    action: 'Login',
    resource: 'Auth',
    details: { method: 'email_password' },
    ipAddress: '10.0.0.5',
  },
  {
    id: 'log-012',
    timestamp: daysAgo(2, 9, 0),
    userId: 'usr-admin-1',
    userName: 'Admin User',
    userEmail: 'admin@gov.ph',
    action: 'Archive',
    resource: 'User Account',
    details: { targetEmail: 'old.staff@gov.ph', reason: 'resigned' },
    ipAddress: '10.0.0.5',
  },
  {
    id: 'log-013',
    timestamp: daysAgo(2, 13, 15),
    userId: 'usr-staff-2',
    userName: 'Ana Processor',
    userEmail: 'ana@gov.ph',
    action: 'Login',
    resource: 'Auth',
    details: { method: 'email_password' },
    ipAddress: '192.168.1.40',
  },
  {
    id: 'log-014',
    timestamp: daysAgo(2, 14, 0),
    userId: 'usr-staff-2',
    userName: 'Ana Processor',
    userEmail: 'ana@gov.ph',
    action: 'Update',
    resource: 'Appointment',
    details: { appointmentId: 'apt-102', oldStatus: 'confirmed', newStatus: 'completed' },
    ipAddress: '192.168.1.40',
  },
  {
    id: 'log-015',
    timestamp: daysAgo(3, 7, 45),
    userId: null,
    userName: null,
    userEmail: null,
    action: 'System Event',
    resource: 'Auth',
    details: { event: 'failed_login_threshold', email: 'unknown@test.com', attempts: 5 },
    ipAddress: '203.0.113.50',
  },
  {
    id: 'log-016',
    timestamp: daysAgo(3, 10, 0),
    userId: 'usr-admin-1',
    userName: 'Admin User',
    userEmail: 'admin@gov.ph',
    action: 'Create',
    resource: 'User Account',
    details: { targetRole: 'manager', targetEmail: 'new.manager@gov.ph' },
    ipAddress: '192.168.1.10',
  },
  {
    id: 'log-017',
    timestamp: daysAgo(3, 15, 30),
    userId: 'usr-manager-1',
    userName: 'Carlos Manager',
    userEmail: 'manager@gov.ph',
    action: 'Archive',
    resource: 'Service',
    details: { serviceName: 'Old Service', reason: 'discontinued' },
    ipAddress: '192.168.1.30',
  },
  {
    id: 'log-018',
    timestamp: daysAgo(4, 9, 0),
    userId: 'usr-staff-1',
    userName: 'Maria Staff',
    userEmail: 'staff@gov.ph',
    action: 'Password Change',
    resource: 'Profile',
    details: { initiatedBy: 'self' },
    ipAddress: '192.168.1.20',
  },
  {
    id: 'log-019',
    timestamp: daysAgo(4, 11, 20),
    userId: 'usr-staff-2',
    userName: 'Ana Processor',
    userEmail: 'ana@gov.ph',
    action: 'Update',
    resource: 'Appointment',
    details: { appointmentId: 'apt-103', field: 'remarks', value: 'Documents verified' },
    ipAddress: '192.168.1.40',
  },
  {
    id: 'log-020',
    timestamp: daysAgo(5, 8, 15),
    userId: 'usr-manager-1',
    userName: 'Carlos Manager',
    userEmail: 'manager@gov.ph',
    action: 'Create',
    resource: 'Service',
    details: { serviceName: 'Business Permit', department: 'Business Affairs' },
    ipAddress: '192.168.1.30',
  },
  {
    id: 'log-021',
    timestamp: daysAgo(5, 12, 0),
    userId: 'usr-admin-1',
    userName: 'Admin User',
    userEmail: 'admin@gov.ph',
    action: 'Password Change',
    resource: 'Profile',
    details: { initiatedBy: 'self' },
    ipAddress: '10.0.0.5',
  },
  {
    id: 'log-022',
    timestamp: daysAgo(5, 16, 45),
    userId: 'usr-manager-1',
    userName: 'Carlos Manager',
    userEmail: 'manager@gov.ph',
    action: 'Archive',
    resource: 'Staff Assignment',
    details: { staffEmail: 'old.staff@gov.ph', serviceName: 'Birth Certificate' },
    ipAddress: '192.168.1.30',
  },
  {
    id: 'log-023',
    timestamp: daysAgo(6, 9, 30),
    userId: null,
    userName: null,
    userEmail: null,
    action: 'System Event',
    resource: 'Auth',
    details: { event: 'password_reset_requested', email: 'staff@gov.ph' },
    ipAddress: null,
  },
  {
    id: 'log-024',
    timestamp: daysAgo(6, 14, 10),
    userId: 'usr-staff-1',
    userName: 'Maria Staff',
    userEmail: 'staff@gov.ph',
    action: 'Login',
    resource: 'Auth',
    details: { method: 'email_password' },
    ipAddress: '192.168.1.20',
  },
  {
    id: 'log-025',
    timestamp: daysAgo(6, 17, 0),
    userId: 'usr-admin-1',
    userName: 'Admin User',
    userEmail: 'admin@gov.ph',
    action: 'Logout',
    resource: 'Auth',
    details: {},
    ipAddress: '10.0.0.5',
  },
];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 10;

const ACTION_OPTIONS = [
  'All',
  'Login',
  'Logout',
  'Create',
  'Update',
  'Archive',
  'Password Change',
  'System Event',
] as const;

const RESOURCE_OPTIONS = [
  'All',
  'Auth',
  'User Account',
  'Appointment',
  'Service',
  'Staff Assignment',
  'Profile',
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AuditLogsPage() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_LOGS);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [resourceFilter, setResourceFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Filtered logs ── */
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Search by user name or email
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const nameMatch = log.userName?.toLowerCase().includes(query) ?? false;
          const emailMatch = log.userEmail?.toLowerCase().includes(query) ?? false;
          if (!nameMatch && !emailMatch) return false;
        }

        // Action filter
        if (actionFilter !== 'All' && log.action !== actionFilter) return false;

        // Resource filter
        if (resourceFilter !== 'All' && log.resource !== resourceFilter) return false;

        // Date range filter
        if (startDate) {
          const logDate = new Date(log.timestamp);
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (endDate) {
          const logDate = new Date(log.timestamp);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchQuery, actionFilter, resourceFilter, startDate, endDate]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  // Reset to page 1 when filters change
  const applyFilter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: T) => {
      setter(value);
      setCurrentPage(1);
    };
  };

  /* ── Stats ── */
  const totalEntries = logs.length;

  const todaysEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return logs.filter((log) => {
      const d = new Date(log.timestamp);
      return d >= today && d < tomorrow;
    }).length;
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    const userIds = new Set(logs.filter((l) => l.userId).map((l) => l.userId));
    return userIds.size;
  }, [logs]);

  /* ── Clear filters ── */
  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('All');
    setResourceFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    actionFilter !== 'All' ||
    resourceFilter !== 'All' ||
    startDate !== '' ||
    endDate !== '';

  /* ── Export CSV ── */
  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Email', 'Action', 'Resource', 'Details', 'IP Address'];
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.userName || 'System',
      log.userEmail || '',
      log.action,
      log.resource,
      JSON.stringify(log.details),
      log.ipAddress || '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} records as CSV.`);
  };

  /* ── Export JSON ── */
  const exportJSON = () => {
    const json = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} records as JSON.`);
  };

  /* ── Format timestamp for display ── */
  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /* ── Format details for display ── */
  const formatDetails = (details: Record<string, unknown>) => {
    const entries = Object.entries(details);
    if (entries.length === 0) return '—';
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">
              Audit Logs
            </h1>
            <p className="text-gray-600">
              View and export system activity logs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download size={20} />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportJSON}>
              <FileText size={20} />
              Export JSON
            </Button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Log Entries"
            value={totalEntries}
            icon={<Shield size={24} />}
            color="var(--gov-primary)"
          />
          <StatCard
            title="Today's Events"
            value={todaysEvents}
            icon={<Activity size={24} />}
            color="#16a34a"
          />
          <StatCard
            title="Unique Users"
            value={uniqueUsers}
            icon={<Users size={24} />}
            color="#2563eb"
          />
        </div>

        {/* ── Filters ── */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-1">
              <Label htmlFor="audit-search" className="text-xs text-gray-500">
                Search User
              </Label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  id="audit-search"
                  placeholder="Name or email..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => applyFilter(setSearchQuery)(e.target.value)}
                />
              </div>
            </div>

            {/* Action filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Action</Label>
              <Select
                value={actionFilter}
                onValueChange={applyFilter(setActionFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resource filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Resource</Label>
              <Select
                value={resourceFilter}
                onValueChange={applyFilter(setResourceFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start date */}
            <div className="space-y-1">
              <Label htmlFor="audit-start-date" className="text-xs text-gray-500">
                Start Date
              </Label>
              <Input
                id="audit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => applyFilter(setStartDate)(e.target.value)}
              />
            </div>

            {/* End date */}
            <div className="space-y-1">
              <Label htmlFor="audit-end-date" className="text-xs text-gray-500">
                End Date
              </Label>
              <Input
                id="audit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => applyFilter(setEndDate)(e.target.value)}
              />
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {filteredLogs.length} of {logs.length} entries
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X size={16} />
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* ── Audit log table ── */}
        <Card className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Action
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Resource
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Details
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No audit log entries found.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <span className="block">
                          {log.userName || (
                            <span className="text-gray-400 italic">System</span>
                          )}
                        </span>
                        {log.userEmail && (
                          <span className="block text-xs text-gray-400">
                            {log.userEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-3 py-1 bg-[var(--gov-accent)] text-[var(--gov-secondary)] rounded-full text-sm">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{log.resource}</td>
                    <td className="py-3 px-4 text-sm max-w-xs truncate" title={formatDetails(log.details)}>
                      {formatDetails(log.details)}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-500">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── Pagination controls ── */}
          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {safeCurrentPage} of {totalPages} ({filteredLogs.length} entries)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
