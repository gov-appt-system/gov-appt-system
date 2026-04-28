import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, MessageSquare, AlertCircle, Loader2, CheckCircle, Ban } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { Textarea } from '../components/ui/textarea';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { realAppointmentAPI, realServiceAPI, BackendAppointment, BackendService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export function ProcessRequestsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<BackendAppointment[]>([]);
  const [services, setServices] = useState<BackendService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Action confirmation state
  const [actionType, setActionType] = useState<'confirm' | 'complete' | 'cancel' | 'no_show' | null>(null);
  const [appointmentToAction, setAppointmentToAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Remarks modal state
  const [remarksAppointment, setRemarksAppointment] = useState<BackendAppointment | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appts, svcs] = await Promise.all([
        realAppointmentAPI.getAll(),
        realServiceAPI.getAll(),
      ]);
      setAppointments(appts);
      setServices(svcs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const serviceNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of services) map[s.id] = s.name;
    return map;
  }, [services]);

  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter(a => a.status === statusFilter);
  }, [appointments, statusFilter]);

  // Status transition helpers
  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'pending': return ['confirm', 'cancel'] as const;
      case 'confirmed': return ['complete', 'cancel', 'no_show'] as const;
      default: return [] as const;
    }
  };

  const actionLabels: Record<string, { label: string; variant: 'default' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    confirm: { label: 'Confirm', variant: 'default', icon: <Check size={16} /> },
    complete: { label: 'Complete', variant: 'default', icon: <CheckCircle size={16} /> },
    cancel: { label: 'Cancel', variant: 'destructive', icon: <X size={16} /> },
    no_show: { label: 'No Show', variant: 'outline', icon: <Ban size={16} /> },
  };

  const statusMap: Record<string, string> = {
    confirm: 'confirmed',
    complete: 'completed',
    cancel: 'cancelled',
    no_show: 'no_show',
  };

  const handleAction = (appointmentId: string, action: 'confirm' | 'complete' | 'cancel' | 'no_show') => {
    setActionType(action);
    setAppointmentToAction(appointmentId);
  };

  const confirmAction = async () => {
    if (!appointmentToAction || !actionType) return;
    setActionLoading(true);
    try {
      const newStatus = statusMap[actionType];
      const updated = await realAppointmentAPI.update(appointmentToAction, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === appointmentToAction ? updated : a));
      toast.success(`Appointment ${newStatus} successfully!`);
    } catch (err: unknown) {
      // Display backend validation errors (e.g. service hours)
      let message = 'Failed to update appointment';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      }
      toast.error(message);
    } finally {
      setActionLoading(false);
      setActionType(null);
      setAppointmentToAction(null);
    }
  };

  const openRemarks = (appt: BackendAppointment) => {
    setRemarksAppointment(appt);
    setRemarksText(appt.remarks || '');
  };

  const saveRemarks = async () => {
    if (!remarksAppointment) return;
    setSavingRemarks(true);
    try {
      const updated = await realAppointmentAPI.update(remarksAppointment.id, { remarks: remarksText });
      setAppointments(prev => prev.map(a => a.id === remarksAppointment.id ? updated : a));
      toast.success('Remarks saved successfully!');
      setRemarksAppointment(null);
    } catch (err: unknown) {
      let message = 'Failed to save remarks';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      }
      toast.error(message);
    } finally {
      setSavingRemarks(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading appointments…</span>
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
          <Button variant="outline" onClick={fetchData}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Process Appointment Requests</h1>
          <p className="text-gray-600">Review and manage appointment requests</p>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({appointments.filter(a => a.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({appointments.filter(a => a.status === 'confirmed').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({appointments.filter(a => a.status === 'completed').length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({appointments.filter(a => a.status === 'cancelled').length})</TabsTrigger>
            <TabsTrigger value="no_show">No Show ({appointments.filter(a => a.status === 'no_show').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            <Card>
              <CardContent className="pt-6">
                {filteredAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No appointments found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking Number</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map(appt => {
                        const actions = getAvailableActions(appt.status);
                        return (
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
                            <TableCell className="text-sm max-w-[200px] truncate">
                              {appt.remarks || '—'}
                            </TableCell>
                            <TableCell>
                              {user?.role === 'admin' ? (
                                <span className="text-sm text-gray-500">View only</span>
                              ) : actions.length > 0 ? (
                                <div className="flex gap-2 flex-wrap">
                                  {actions.map(action => {
                                    const cfg = actionLabels[action];
                                    return (
                                      <Button
                                        key={action}
                                        variant={cfg.variant}
                                        size="sm"
                                        onClick={() => handleAction(appt.id, action)}
                                      >
                                        {cfg.icon}
                                        {cfg.label}
                                      </Button>
                                    );
                                  })}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRemarks(appt)}
                                  >
                                    <MessageSquare size={16} />
                                    Remarks
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRemarks(appt)}
                                >
                                  <MessageSquare size={16} />
                                  View Remarks
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Remarks Modal */}
        <Dialog open={remarksAppointment !== null} onOpenChange={(open) => { if (!open) setRemarksAppointment(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Staff Remarks</DialogTitle>
              <DialogDescription>
                Tracking Number: {remarksAppointment?.trackingNumber}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              rows={4}
              placeholder="Enter your remarks here..."
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemarksAppointment(null)}>
                Cancel
              </Button>
              <Button onClick={saveRemarks} disabled={savingRemarks}>
                {savingRemarks ? 'Saving…' : 'Save Remarks'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Confirmation Dialog */}
        <AlertDialog open={actionType !== null} onOpenChange={(open) => { if (!open) { setActionType(null); setAppointmentToAction(null); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType ? `${actionLabels[actionType].label} Appointment` : ''}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {actionType ? actionType.replace('_', ' ') : ''} this appointment?
                {actionType === 'cancel' && ' This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction}
                disabled={actionLoading}
                className={actionType === 'cancel' || actionType === 'no_show' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                {actionLoading ? 'Processing…' : actionType ? actionLabels[actionType].label : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
