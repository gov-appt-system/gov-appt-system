import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Calendar, X, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
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
import { StatusBadge } from '../components/StatusBadge';
import { appointmentAPI, Appointment } from '../services/api';
import { toast } from 'sonner';

export function MyAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [appointmentToAction, setAppointmentToAction] = useState<Appointment | null>(null);

  // Load appointments on mount
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await appointmentAPI.getAll();
        setAppointments(data);
      } catch (error) {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, []);

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCancelAppointment = async () => {
    if (!appointmentToAction) return;
    
    try {
      await appointmentAPI.updateStatus(appointmentToAction.id, 'cancelled');
      setAppointments(prev => 
        prev.map(apt => apt.id === appointmentToAction.id ? { ...apt, status: 'cancelled' as const } : apt)
      );
      toast.success('Appointment cancelled successfully');
      setShowCancelDialog(false);
      setAppointmentToAction(null);
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleReschedule = async () => {
    if (!appointmentToAction) return;
    
    // In a real app, this would navigate to a reschedule page or show a date picker
    toast.info('Reschedule functionality coming soon');
    setShowRescheduleDialog(false);
    setAppointmentToAction(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">My Appointments</h1>
          <p className="text-gray-600">View and manage your appointment requests</p>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by tracking number or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Appointments Table */}
        <Card className="p-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading appointments...</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Tracking Number</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Service</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Time</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(appointment => (
                    <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{appointment.trackingNumber}</td>
                      <td className="py-3 px-4 text-sm">{appointment.service}</td>
                      <td className="py-3 px-4 text-sm">{new Date(appointment.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm">{appointment.time}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/appointments/${appointment.id}`)}
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setAppointmentToAction(appointment);
                                  setShowRescheduleDialog(true);
                                }}
                              >
                                <Calendar size={16} className="mr-1" />
                                Reschedule
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setAppointmentToAction(appointment);
                                  setShowCancelDialog(true);
                                }}
                              >
                                <X size={16} className="mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAppointments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No appointments found
                </div>
              )}
            </>
          )}
        </Card>

        {/* Appointment Details Modal */}
        <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[var(--gov-secondary)]">Appointment Details</DialogTitle>
              <DialogDescription>View complete information about your appointment</DialogDescription>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="text-lg text-[var(--gov-primary)]">{selectedAppointment.trackingNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="text-[var(--gov-secondary)]">{selectedAppointment.service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <StatusBadge status={selectedAppointment.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-[var(--gov-secondary)]">
                      {new Date(selectedAppointment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="text-[var(--gov-secondary)]">{selectedAppointment.time}</p>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="text-gray-700">
                    {new Date(selectedAppointment.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    className="flex-1 bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
                  >
                    Download Receipt
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <AlertDialogTitle className="text-xl">Cancel Appointment</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Are you sure you want to cancel this appointment? This action cannot be undone.
                {appointmentToAction && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Tracking Number:</strong> {appointmentToAction.trackingNumber}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Service:</strong> {appointmentToAction.service}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Date:</strong> {new Date(appointmentToAction.date).toLocaleDateString()} at {appointmentToAction.time}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAppointmentToAction(null)}>
                No, Keep Appointment
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelAppointment}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Cancel Appointment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reschedule Confirmation Dialog */}
        <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <AlertDialogTitle className="text-xl">Reschedule Appointment</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Would you like to reschedule this appointment to a different date and time?
                {appointmentToAction && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Current Date:</strong> {new Date(appointmentToAction.date).toLocaleDateString()} at {appointmentToAction.time}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAppointmentToAction(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReschedule}
                className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
              >
                Continue to Reschedule
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}