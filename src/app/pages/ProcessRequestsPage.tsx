import { useState } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
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
import { INITIAL_APPOINTMENTS, Appointment } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function ProcessRequestsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [appointmentToAction, setAppointmentToAction] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setActionType('approve');
    setAppointmentToAction(id);
  };

  const confirmApprove = () => {
    if (appointmentToAction) {
      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentToAction ? { ...apt, status: 'confirmed' as const } : apt)
      );
      toast.success('Appointment approved successfully!');
      setActionType(null);
      setAppointmentToAction(null);
    }
  };

  const handleReject = (id: string) => {
    setActionType('reject');
    setAppointmentToAction(id);
  };

  const confirmReject = () => {
    if (appointmentToAction) {
      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentToAction ? { ...apt, status: 'cancelled' as const } : apt)
      );
      toast.success('Appointment rejected successfully!');
      setActionType(null);
      setAppointmentToAction(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Process Appointment Requests</h1>
          <p className="text-gray-600">Review and approve appointment requests</p>
        </div>

        <Card className="p-6 overflow-x-auto">
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
              {appointments.map(appointment => (
                <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{appointment.trackingNumber}</td>
                  <td className="py-3 px-4 text-sm">{appointment.clientName}</td>
                  <td className="py-3 px-4 text-sm">{appointment.service}</td>
                  <td className="py-3 px-4 text-sm">{new Date(appointment.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm">{appointment.time}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="py-3 px-4">
                    {user?.role === 'admin' ? (
                      <span className="text-sm text-gray-500">View only</span>
                    ) : appointment.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(appointment.id)}
                        >
                          <Check size={16} />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(appointment.id)}
                        >
                          <X size={16} />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <MessageSquare size={16} />
                          Remarks
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Remarks Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAppointment(null)}>
            <Card className="max-w-lg w-full m-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h2 className="text-xl text-[var(--gov-secondary)] mb-4">Add Staff Remarks</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Tracking Number: {selectedAppointment.trackingNumber}
                </p>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gov-primary)] focus:border-transparent"
                  rows={4}
                  placeholder="Enter your remarks here..."
                />
                <div className="flex gap-3 mt-4">
                  <Button variant="primary" className="flex-1">Save Remarks</Button>
                  <Button variant="outline" onClick={() => setSelectedAppointment(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={actionType !== null} onOpenChange={() => { setActionType(null); setAppointmentToAction(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === 'approve' ? 'Approve Appointment' : 'Reject Appointment'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {actionType === 'approve' ? 'approve' : 'reject'} this appointment?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setActionType(null); setAppointmentToAction(null); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={actionType === 'approve' ? confirmApprove : confirmReject}
                className={actionType === 'approve' ? 'bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90' : 'bg-red-500 hover:bg-red-600'}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}