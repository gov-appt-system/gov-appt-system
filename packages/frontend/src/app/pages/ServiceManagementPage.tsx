import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Power } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { SERVICES, Service } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface AddServiceFormData {
  category: string;
  name: string;
  duration: string;
  price: string;
  description: string;
}

export function ServiceManagementPage() {
  const { user } = useAuth();
  const [services, setServices] = useState(SERVICES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddServiceFormData>();

  const categories = [
    'Certifications & Documents',
    'Public Safety',
    'Health & Social Welfare',
    'Disaster & Community Services',
    'Civil Registry',
  ];

  const onSubmitNewService = async (data: AddServiceFormData) => {
    setAdding(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add new service to the list
      const newService: Service = {
        id: String(services.length + 1),
        name: data.name,
        description: data.description,
        department: data.category,
        operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        businessHours: '8:00 AM - 5:00 PM',
        maxDailySlots: 20,
        requiredDocuments: ['Valid ID'],
      };
      
      setServices([...services, newService]);
      toast.success('Service added successfully!');
      setShowAddModal(false);
      reset();
      setSelectedCategory('');
    } catch (error) {
      toast.error('Failed to add service');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setDeleteServiceId(id);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Remove service from the list
      setServices(services.filter(service => service.id !== id));
      toast.success('Service deleted successfully!');
      setDeleteServiceId(null);
    } catch (error) {
      toast.error('Failed to delete service');
    } finally {
      setDeleteServiceId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Service Management</h1>
            <p className="text-gray-600">
              {user?.role === 'admin' ? 'View government services and statistics' : 'Manage government services and availability'}
            </p>
          </div>
          {user?.role !== 'admin' && (
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={20} />
              Add New Service
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {services.map(service => (
            <Card key={service.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl text-[var(--gov-secondary)] mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Department</p>
                      <p className="text-[var(--gov-secondary)]">{service.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Business Hours</p>
                      <p className="text-[var(--gov-secondary)]">{service.businessHours}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Operating Days</p>
                      <p className="text-[var(--gov-secondary)]">{service.operatingDays.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Maximum Daily Slots</p>
                      <p className="text-[var(--gov-secondary)]">{service.maxDailySlots}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-gray-600 text-sm mb-2">Required Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {service.requiredDocuments.map((doc, index) => (
                        <span key={index} className="px-3 py-1 bg-[var(--gov-accent)] text-[var(--gov-secondary)] rounded-full text-sm">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {user?.role !== 'admin' && (
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Edit size={16} />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Power size={16} />
                      Active
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteServiceId(service.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Add Service Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Create a new government service offering
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmitNewService)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Select Category *</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  {...register('category', { required: 'Category is required' })}
                  value={selectedCategory}
                />
                {errors.category && !selectedCategory && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Service Request Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Birth Certificate Request"
                  {...register('name', { required: 'Service name is required' })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 30 minutes"
                    {...register('duration', { required: 'Duration is required' })}
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-600">{errors.duration.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 150"
                    {...register('price', { required: 'Price is required' })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Notes *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe the service details or requirements..."
                  {...register('description', { required: 'Description is required' })}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                    setSelectedCategory('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={adding}
                  className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
                >
                  {adding ? 'Saving...' : 'Save Service'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Service Confirmation Dialog */}
        <AlertDialog open={deleteServiceId !== null} onOpenChange={(open) => { if (!open) setDeleteServiceId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the service from the list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteService(deleteServiceId!)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}