import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Edit,
  Archive,
  Search,
  UserPlus,
  Users,
  UserCheck,
  UserX,
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StaffAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  department: string;
  role: 'staff' | 'manager';
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
}

interface CreateAccountFormData {
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  email: string;
  role: string;
  temporaryPassword: string;
}

interface EditAccountFormData {
  firstName: string;
  lastName: string;
  department: string;
  email: string;
}

/* ------------------------------------------------------------------ */
/*  Initial mock data                                                  */
/* ------------------------------------------------------------------ */

const INITIAL_ACCOUNTS: StaffAccount[] = [
  {
    id: '1',
    firstName: 'Maria',
    lastName: 'Staff',
    email: 'staff@gov.ph',
    employeeId: 'EMP-001',
    department: 'Civil Registry',
    role: 'staff',
    isActive: true,
    archivedAt: null,
    createdAt: '2026-01-15T08:00:00',
  },
  {
    id: '2',
    firstName: 'Carlos',
    lastName: 'Manager',
    email: 'manager@gov.ph',
    employeeId: 'EMP-002',
    department: 'All Departments',
    role: 'manager',
    isActive: true,
    archivedAt: null,
    createdAt: '2026-01-10T08:00:00',
  },
  {
    id: '3',
    firstName: 'Ana',
    lastName: 'Processor',
    email: 'ana@gov.ph',
    employeeId: 'EMP-003',
    department: 'Treasury Office',
    role: 'staff',
    isActive: true,
    archivedAt: null,
    createdAt: '2026-02-01T08:00:00',
  },
  {
    id: '4',
    firstName: 'Roberto',
    lastName: 'Supervisor',
    email: 'roberto@gov.ph',
    employeeId: 'EMP-004',
    department: 'Business Affairs',
    role: 'manager',
    isActive: true,
    archivedAt: null,
    createdAt: '2026-02-10T08:00:00',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<StaffAccount[]>(INITIAL_ACCOUNTS);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<StaffAccount | null>(null);

  // Filter / search state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'staff' | 'manager'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Forms
  const createForm = useForm<CreateAccountFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      employeeId: '',
      department: '',
      email: '',
      role: '',
      temporaryPassword: '',
    },
  });

  const editForm = useForm<EditAccountFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      department: '',
      email: '',
    },
  });

  /* ── Filtered accounts ── */
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const fullName = `${account.firstName} ${account.lastName}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        fullName.includes(query) ||
        account.email.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'all' || account.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && account.isActive) ||
        (statusFilter === 'archived' && !account.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  /* ── Stats ── */
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.isActive).length;
  const archivedAccounts = accounts.filter((a) => !a.isActive).length;

  /* ── Create account ── */
  const onCreateSubmit = (data: CreateAccountFormData) => {
    // Validate no duplicate email
    const duplicate = accounts.find(
      (a) => a.email.toLowerCase() === data.email.toLowerCase(),
    );
    if (duplicate) {
      toast.error('An account with this email already exists.');
      return;
    }

    // Validate all fields
    if (
      !data.firstName ||
      !data.lastName ||
      !data.employeeId ||
      !data.department ||
      !data.email ||
      !data.role ||
      !data.temporaryPassword
    ) {
      toast.error('All fields are required.');
      return;
    }

    const newAccount: StaffAccount = {
      id: crypto.randomUUID(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      employeeId: data.employeeId,
      department: data.department,
      role: data.role as 'staff' | 'manager',
      isActive: true,
      archivedAt: null,
      createdAt: new Date().toISOString(),
    };

    setAccounts((prev) => [...prev, newAccount]);
    setCreateOpen(false);
    createForm.reset();
    toast.success(
      `Account created for ${newAccount.firstName} ${newAccount.lastName}.`,
    );
  };

  /* ── Edit account ── */
  const handleEdit = (account: StaffAccount) => {
    setSelectedAccount(account);
    editForm.setValue('firstName', account.firstName);
    editForm.setValue('lastName', account.lastName);
    editForm.setValue('department', account.department);
    editForm.setValue('email', account.email);
    setEditOpen(true);
  };

  const onEditSubmit = (data: EditAccountFormData) => {
    if (!selectedAccount) return;

    // Check duplicate email (excluding current account)
    const duplicate = accounts.find(
      (a) =>
        a.id !== selectedAccount.id &&
        a.email.toLowerCase() === data.email.toLowerCase(),
    );
    if (duplicate) {
      toast.error('An account with this email already exists.');
      return;
    }

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === selectedAccount.id
          ? { ...a, firstName: data.firstName, lastName: data.lastName, department: data.department, email: data.email }
          : a,
      ),
    );
    setEditOpen(false);
    toast.success('Account updated successfully.');
  };

  /* ── Archive account ── */
  const handleArchive = (account: StaffAccount) => {
    setSelectedAccount(account);
    setArchiveOpen(true);
  };

  const onArchiveConfirm = () => {
    if (!selectedAccount) return;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === selectedAccount.id
          ? { ...a, isActive: false, archivedAt: new Date().toISOString() }
          : a,
      ),
    );
    setArchiveOpen(false);
    toast.success(
      `Account for ${selectedAccount.firstName} ${selectedAccount.lastName} has been archived.`,
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">
              Account Management
            </h1>
            <p className="text-gray-600">
              Create and manage staff and manager accounts
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={20} />
            Create Account
          </Button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Accounts"
            value={totalAccounts}
            icon={<Users size={24} />}
            color="var(--gov-primary)"
          />
          <StatCard
            title="Active Accounts"
            value={activeAccounts}
            icon={<UserCheck size={24} />}
            color="#16a34a"
          />
          <StatCard
            title="Archived Accounts"
            value={archivedAccounts}
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
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(val) =>
                setRoleFilter(val as 'all' | 'staff' | 'manager')
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
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

        {/* ── Accounts table ── */}
        <Card className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Employee ID
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Department
                </th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">
                  Email
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
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-gray-500"
                  >
                    No accounts found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm">
                      {account.firstName} {account.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {account.employeeId}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-3 py-1 bg-[var(--gov-accent)] text-[var(--gov-secondary)] rounded-full text-sm capitalize">
                        {account.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {account.department}
                    </td>
                    <td className="py-3 px-4 text-sm">{account.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          account.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(account)}
                          disabled={!account.isActive}
                        >
                          <Edit size={16} />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleArchive(account)}
                          disabled={!account.isActive}
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
        </Card>
      </div>

      {/* ── Create Account Dialog ── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) createForm.reset();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={20} />
              Create New Account
            </DialogTitle>
            <DialogDescription>
              Enter the details for the new staff or manager account.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-firstName">First Name</Label>
                <Input
                  id="create-firstName"
                  placeholder="First name"
                  {...createForm.register('firstName', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastName">Last Name</Label>
                <Input
                  id="create-lastName"
                  placeholder="Last name"
                  {...createForm.register('lastName', { required: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-employeeId">Employee ID</Label>
              <Input
                id="create-employeeId"
                placeholder="EMP-XXX"
                {...createForm.register('employeeId', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-department">Department</Label>
              <Input
                id="create-department"
                placeholder="Department name"
                {...createForm.register('department', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="email@gov.ph"
                {...createForm.register('email', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                onValueChange={(val) => createForm.setValue('role', val)}
              >
                <SelectTrigger id="create-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Temporary Password</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Temporary password"
                {...createForm.register('temporaryPassword', {
                  required: true,
                })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  createForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Account Dialog ── */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedAccount(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={20} />
              Edit Account
            </DialogTitle>
            <DialogDescription>
              Update account information for{' '}
              {selectedAccount
                ? `${selectedAccount.firstName} ${selectedAccount.lastName}`
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
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                placeholder="Department name"
                {...editForm.register('department', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@gov.ph"
                {...editForm.register('email', { required: true })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setSelectedAccount(null);
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
          if (!open) setSelectedAccount(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the account for{' '}
              <span className="font-semibold">
                {selectedAccount
                  ? `${selectedAccount.firstName} ${selectedAccount.lastName}`
                  : ''}
              </span>
              . The account will be marked as archived and the user will no
              longer be able to log in. Historical records will be preserved.
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
