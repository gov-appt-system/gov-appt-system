import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Edit,
  Archive,
  Search,
  Users,
  UserCheck,
  UserX,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { adminAPI, ClientAccount } from '../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EditClientFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminClientsPage() {
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);

  // Filter / search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Load clients from API
  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await adminAPI.getClients();
        setClients(data);
      } catch (err) {
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  // Forms
  const editForm = useForm<EditClientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '',
    },
  });

  /* ── Filtered clients ── */
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const fullName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        fullName.includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.governmentId ?? '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && client.isActive) ||
        (statusFilter === 'archived' && !client.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  /* ── Stats ── */
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.isActive).length;
  const archivedClients = clients.filter((c) => !c.isActive).length;

  /* ── View client details ── */
  const handleView = (client: ClientAccount) => {
    setSelectedClient(client);
    setViewOpen(true);
  };

  /* ── Edit client ── */
  const handleEdit = (client: ClientAccount) => {
    setSelectedClient(client);
    editForm.setValue('firstName', client.firstName ?? '');
    editForm.setValue('lastName', client.lastName ?? '');
    editForm.setValue('phoneNumber', client.phoneNumber ?? '');
    editForm.setValue('address', client.address ?? '');
    setEditOpen(true);
  };

  const onEditSubmit = async (data: EditClientFormData) => {
    if (!selectedClient) return;

    try {
      await adminAPI.updateClient(selectedClient.userId, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: data.address,
      });
      setClients((prev) =>
        prev.map((c) =>
          c.userId === selectedClient.userId
            ? {
                ...c,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                address: data.address,
              }
            : c,
        ),
      );
      setEditOpen(false);
      toast.success('Client information updated successfully.');
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to update client.';
      toast.error(message);
    }
  };

  /* ── Archive client ── */
  const handleArchive = (client: ClientAccount) => {
    setSelectedClient(client);
    setArchiveOpen(true);
  };

  const onArchiveConfirm = async () => {
    if (!selectedClient) return;

    try {
      await adminAPI.updateClient(selectedClient.userId, { isActive: false });
      setClients((prev) =>
        prev.map((c) =>
          c.userId === selectedClient.userId
            ? { ...c, isActive: false, archivedAt: new Date().toISOString() }
            : c,
        ),
      );
      setArchiveOpen(false);
      toast.success(
        `Client account for ${selectedClient.firstName} ${selectedClient.lastName} has been archived.`,
      );
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to archive client.';
      toast.error(message);
    }
  };

  /* ── Format date helper ── */
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">
              Client Management
            </h1>
            <p className="text-gray-600">
              View and manage client accounts
            </p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Clients"
            value={totalClients}
            icon={<Users size={24} />}
            color="var(--gov-primary)"
          />
          <StatCard
            title="Active Clients"
            value={activeClients}
            icon={<UserCheck size={24} />}
            color="#16a34a"
          />
          <StatCard
            title="Archived Clients"
            value={archivedClients}
            icon={<UserX size={24} />}
            color="#dc2626"
          />
        </div>

        {/* ── Filters ── */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search by name, email, or government ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val as 'all' | 'active' | 'archived')
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* ── Clients table ── */}
        <Card className="p-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading clients...</div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Phone
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Government ID
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Date of Birth
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-gray-500"
                  >
                    No clients found.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.userId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm">
                      {client.firstName} {client.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm">{client.email}</td>
                    <td className="py-3 px-4 text-sm">{client.phoneNumber}</td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {client.governmentId}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {client.dateOfBirth ? formatDate(client.dateOfBirth) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          client.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {client.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(client)}
                        >
                          <Eye size={16} />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                          disabled={!client.isActive}
                        >
                          <Edit size={16} />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleArchive(client)}
                          disabled={!client.isActive}
                        >
                          <Archive size={16} />
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </Card>
      </div>

      {/* ── View Client Details Dialog ── */}
      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setSelectedClient(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye size={20} />
              Client Details
            </DialogTitle>
            <DialogDescription>
              Full information for{' '}
              {selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`
                : ''}
              .
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">First Name</Label>
                  <p className="text-sm font-medium">{selectedClient.firstName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Last Name</Label>
                  <p className="text-sm font-medium">{selectedClient.lastName}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Email</Label>
                <p className="text-sm font-medium">{selectedClient.email}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Phone Number</Label>
                <p className="text-sm font-medium">{selectedClient.phoneNumber}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Address</Label>
                <p className="text-sm font-medium">{selectedClient.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Date of Birth</Label>
                  <p className="text-sm font-medium">
                    {selectedClient.dateOfBirth ? formatDate(selectedClient.dateOfBirth) : '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Government ID</Label>
                  <p className="text-sm font-medium font-mono">
                    {selectedClient.governmentId}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Registration Date</Label>
                <p className="text-sm font-medium">
                  {formatDate(selectedClient.createdAt)}
                </p>
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Status</Label>
                <p className="text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedClient.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedClient.isActive ? 'Active' : 'Archived'}
                  </span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setViewOpen(false);
                setSelectedClient(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Client Dialog ── */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedClient(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={20} />
              Edit Client
            </DialogTitle>
            <DialogDescription>
              Update information for{' '}
              {selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`
                : ''}
              .
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  placeholder="First name"
                  {...editForm.register('firstName', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  placeholder="Last name"
                  {...editForm.register('lastName', { required: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phoneNumber">Phone Number</Label>
              <Input
                id="edit-phoneNumber"
                placeholder="+63-XXX-XXX-XXXX"
                {...editForm.register('phoneNumber', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                placeholder="Address"
                {...editForm.register('address', { required: true })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setSelectedClient(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Archive Confirmation Dialog ── */}
      <AlertDialog
        open={archiveOpen}
        onOpenChange={(open) => {
          setArchiveOpen(open);
          if (!open) setSelectedClient(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this client account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the account for{' '}
              <span className="font-semibold">
                {selectedClient
                  ? `${selectedClient.firstName} ${selectedClient.lastName}`
                  : ''}
              </span>
              . The account will be marked as archived and the client will no
              longer be able to log in. All appointment history and records will
              be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onArchiveConfirm}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
