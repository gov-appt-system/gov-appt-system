import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, UserX } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
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

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedService: string;
  status: 'active' | 'inactive';
  address: string;
  username: string;
}

interface AddStaffFormData {
  name: string;
  address: string;
  role: string;
  email: string;
  username: string;
  temporaryPassword: string;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: '1',
    name: 'Maria Staff',
    email: 'staff@gov.ph',
    role: 'Staff',
    assignedService: 'Civil Registry',
    status: 'active',
    address: 'Quezon City',
    username: 'maria.staff'
  },
  {
    id: '2',
    name: 'Carlos Manager',
    email: 'manager@gov.ph',
    role: 'Manager',
    assignedService: 'All Services',
    status: 'active',
    address: 'Manila',
    username: 'carlos.manager'
  }
];

export function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const form = useForm<AddStaffFormData>({
    defaultValues: {
      name: '',
      address: '',
      role: '',
      email: '',
      username: '',
      temporaryPassword: ''
    }
  });

  const editForm = useForm<AddStaffFormData>({
    defaultValues: {
      name: '',
      address: '',
      role: '',
      email: '',
      username: '',
      temporaryPassword: ''
    }
  });

  const onSubmit = (data: AddStaffFormData) => {
    const newStaff: StaffMember = {
      id: (staff.length + 1).toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      assignedService: 'All Services',
      status: 'active',
      address: data.address,
      username: data.username
    };
    setStaff([...staff, newStaff]);
    setOpen(false);
    toast.success('Staff added successfully!');
  };

  const onEditSubmit = (data: AddStaffFormData) => {
    if (selectedStaff) {
      const updatedStaff: StaffMember = {
        id: selectedStaff.id,
        name: data.name,
        email: data.email,
        role: data.role,
        assignedService: 'All Services',
        status: 'active',
        address: data.address,
        username: data.username
      };
      setStaff(staff.map(member => (member.id === selectedStaff.id ? updatedStaff : member)));
      setEditOpen(false);
      toast.success('Staff updated successfully!');
    }
  };

  const onDelete = () => {
    if (selectedStaff) {
      setStaff(staff.filter(member => member.id !== selectedStaff.id));
      setDeleteOpen(false);
      toast.success('Staff deleted successfully!');
    }
  };

  const handleEdit = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    editForm.setValue('name', staffMember.name);
    editForm.setValue('address', staffMember.address);
    editForm.setValue('role', staffMember.role);
    editForm.setValue('email', staffMember.email);
    editForm.setValue('username', staffMember.username);
    setEditOpen(true);
  };

  const handleDelete = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setDeleteOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Staff Management</h1>
            <p className="text-gray-600">Manage staff accounts and permissions</p>
          </div>
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus size={20} />
            Add New Staff
          </Button>
        </div>

        <Card className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Staff Name</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Role</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Assigned Service</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{member.name}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="px-3 py-1 bg-[var(--gov-accent)] text-[var(--gov-secondary)] rounded-full text-sm">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{member.assignedService}</td>
                  <td className="py-3 px-4 text-sm">{member.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                        <Edit size={16} />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(member)}>
                        <UserX size={16} />
                        Deactivate
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(member)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Staff</DialogTitle>
            <DialogDescription>
              Enter the details of the new staff member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                className="col-span-3"
                placeholder="John Doe"
                {...form.register('name')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                className="col-span-3"
                placeholder="123 Main St"
                {...form.register('address')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role">Role</Label>
              <Select
                onValueChange={(val) => form.setValue('role', val)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className="col-span-3"
                placeholder="email@example.com"
                {...form.register('email')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="col-span-3"
                placeholder="username"
                {...form.register('username')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temporaryPassword">Temporary Password</Label>
              <Input
                id="temporaryPassword"
                className="col-span-3"
                placeholder="password"
                type="password"
                {...form.register('temporaryPassword')}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add Staff</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
            <DialogDescription>
              Update the details of the staff member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                className="col-span-3"
                placeholder="John Doe"
                {...editForm.register('name')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                className="col-span-3"
                placeholder="123 Main St"
                {...editForm.register('address')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role">Role</Label>
              <Select
                onValueChange={(val) => editForm.setValue('role', val)}
                defaultValue={selectedStaff?.role}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className="col-span-3"
                placeholder="email@example.com"
                {...editForm.register('email')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="col-span-3"
                placeholder="username"
                {...editForm.register('username')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temporaryPassword">Temporary Password</Label>
              <Input
                id="temporaryPassword"
                className="col-span-3"
                placeholder="password"
                type="password"
                {...editForm.register('temporaryPassword')}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Update Staff</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}