import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';
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
import { realServiceAPI, assignmentAPI, BackendService, BackendAssignment } from '../services/api';
import { toast } from 'sonner';

export function StaffAssignmentPage() {
  const [services, setServices] = useState<BackendService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assign staff form
  const [staffIdInput, setStaffIdInput] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Remove confirmation
  const [removeAssignment, setRemoveAssignment] = useState<BackendAssignment | null>(null);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    setError(null);
    try {
      const data = await realServiceAPI.getAll();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchAssignments = useCallback(async (serviceId: string) => {
    if (!serviceId) {
      setAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    try {
      const data = await assignmentAPI.getByService(serviceId);
      setAssignments(data);
    } catch (err: unknown) {
      let message = 'Failed to load assignments';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      }
      toast.error(message);
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    fetchAssignments(serviceId);
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = staffIdInput.trim();
    if (!trimmedId) {
      toast.error('Please enter a staff user ID');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Please select a service first');
      return;
    }

    setAssigning(true);
    try {
      const created = await assignmentAPI.create(selectedServiceId, trimmedId);
      setAssignments(prev => [...prev, created]);
      setStaffIdInput('');
      toast.success('Staff assigned successfully!');
    } catch (err: unknown) {
      let message = 'Failed to assign staff';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      }
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!removeAssignment || !selectedServiceId) return;
    try {
      await assignmentAPI.remove(selectedServiceId, removeAssignment.id);
      setAssignments(prev => prev.filter(a => a.id !== removeAssignment.id));
      toast.success('Assignment removed successfully!');
    } catch (err: unknown) {
      let message = 'Failed to remove assignment';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      }
      toast.error(message);
    } finally {
      setRemoveAssignment(null);
    }
  };

  if (loadingServices) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading services…</span>
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
          <Button variant="outline" onClick={fetchServices}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Staff Assignments</h1>
          <p className="text-gray-600">Manage staff assignments to services</p>
        </div>

        {/* Service selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Select value={selectedServiceId} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service to manage assignments" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} — {service.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedServiceId && (
          <>
            {/* Assign new staff */}
            <Card>
              <CardHeader>
                <CardTitle>Assign Staff to {selectedService?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAssignStaff} className="flex gap-3 items-end">
                  <div className="flex-1 max-w-md space-y-2">
                    <Label htmlFor="staffId">Staff User ID (UUID)</Label>
                    <Input
                      id="staffId"
                      placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                      value={staffIdInput}
                      onChange={(e) => setStaffIdInput(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={assigning}>
                    <UserPlus size={16} />
                    {assigning ? 'Assigning…' : 'Assign'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current assignments */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Current Assignments ({assignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAssignments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading assignments…</span>
                  </div>
                ) : assignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No staff assigned to this service yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Assigned At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map(assignment => (
                        <TableRow key={assignment.id}>
                          <TableCell className="text-sm">
                            {assignment.staff
                              ? `${assignment.staff.firstName} ${assignment.staff.lastName}`
                              : assignment.staffId}
                          </TableCell>
                          <TableCell className="text-sm">
                            {assignment.staff?.employeeId || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {assignment.staff?.department || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {assignment.staff?.email || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRemoveAssignment(assignment)}
                            >
                              <Trash2 size={16} />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Remove Assignment Confirmation */}
        <AlertDialog open={removeAssignment !== null} onOpenChange={(open) => { if (!open) setRemoveAssignment(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Staff Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                This will revoke the staff member's access to this service's appointment queue. The historical assignment record will be preserved. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveAssignment}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
