import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Archive, Loader2, AlertCircle, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
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
import { serviceAPI, BackendService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ServiceFormData {
  name: string;
  description: string;
  department: string;
  duration: number;
  capacity: number;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  requiredDocuments: string[];
}

const emptyForm: ServiceFormData = {
  name: '',
  description: '',
  department: '',
  duration: 30,
  capacity: 1,
  startTime: '08:00',
  endTime: '17:00',
  daysOfWeek: [1, 2, 3, 4, 5],
  requiredDocuments: [],
};

export function ServiceManagementPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<BackendService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState<BackendService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  // Archive confirmation
  const [archiveServiceId, setArchiveServiceId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceAPI.getAll();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData(emptyForm);
    setNewDocName('');
    setShowFormModal(true);
  };

  const openEditModal = (service: BackendService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      department: service.department,
      duration: service.duration,
      capacity: service.capacity,
      startTime: service.operatingHours.startTime,
      endTime: service.operatingHours.endTime,
      daysOfWeek: [...service.operatingHours.daysOfWeek],
      requiredDocuments: [...service.requiredDocuments],
    });
    setNewDocName('');
    setShowFormModal(true);
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const addDocument = () => {
    const trimmed = newDocName.trim();
    if (trimmed && !formData.requiredDocuments.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        requiredDocuments: [...prev.requiredDocuments, trimmed],
      }));
      setNewDocName('');
    }
  };

  const removeDocument = (doc: string) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter(d => d !== doc),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      toast.error('Please select at least one operating day');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        department: formData.department,
        duration: formData.duration,
        capacity: formData.capacity,
        startTime: formData.startTime,
        endTime: formData.endTime,
        daysOfWeek: formData.daysOfWeek,
        requiredDocuments: formData.requiredDocuments,
      };

      if (editingService) {
        const updated = await serviceAPI.update(editingService.id, payload);
        setServices(prev => prev.map(s => s.id === editingService.id ? updated : s));
        toast.success('Service updated successfully!');
      } else {
        const created = await serviceAPI.create(payload);
        setServices(prev => [...prev, created]);
        toast.success('Service created successfully!');
      }
      setShowFormModal(false);
    } catch (err: unknown) {
      let message = 'Failed to save service';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveServiceId) return;
    try {
      await serviceAPI.archive(archiveServiceId);
      setServices(prev => prev.filter(s => s.id !== archiveServiceId));
      toast.success('Service archived successfully!');
    } catch (err: unknown) {
      let message = 'Failed to archive service';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      }
      toast.error(message);
    } finally {
      setArchiveServiceId(null);
    }
  };

  const formatDays = (days: number[]) =>
    days.map(d => DAY_NAMES[d]).join(', ');

  if (loading) {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Service Management</h1>
            <p className="text-gray-600">Manage government services and availability</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus size={20} />
            Add New Service
          </Button>
        </div>

        {services.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">No services found. Create your first service to get started.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {services.map(service => (
              <Card key={service.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl text-[var(--gov-secondary)] mb-2">{service.name}</h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Department</p>
                          <p className="text-[var(--gov-secondary)] font-medium">{service.department}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Operating Hours</p>
                          <p className="text-[var(--gov-secondary)] font-medium">
                            {service.operatingHours.startTime} – {service.operatingHours.endTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Operating Days</p>
                          <p className="text-[var(--gov-secondary)] font-medium">
                            {formatDays(service.operatingHours.daysOfWeek)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="text-[var(--gov-secondary)] font-medium">{service.duration} minutes</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Capacity</p>
                          <p className="text-[var(--gov-secondary)] font-medium">{service.capacity} per slot</p>
                        </div>
                      </div>

                      {service.requiredDocuments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-500 text-sm mb-2">Required Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {service.requiredDocuments.map((doc, index) => (
                              <Badge key={index} variant="secondary">{doc}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(service)}>
                        <Edit size={16} />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setArchiveServiceId(service.id)}
                      >
                        <Archive size={16} />
                        Archive
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit Service Modal */}
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              <DialogDescription>
                {editingService ? 'Update the service configuration' : 'Create a new government service offering'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Birth Certificate Request"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  placeholder="e.g., Civil Registry"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Describe the service details..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (per slot) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Operating Days *</Label>
                <div className="flex flex-wrap gap-3">
                  {DAY_NAMES.map((name, index) => (
                    <label key={index} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.daysOfWeek.includes(index)}
                        onCheckedChange={() => handleDayToggle(index)}
                      />
                      <span className="text-sm">{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Required Documents</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Valid ID"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDocument(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addDocument}>Add</Button>
                </div>
                {formData.requiredDocuments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.requiredDocuments.map((doc, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {doc}
                        <button
                          type="button"
                          onClick={() => removeDocument(doc)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingService ? 'Update Service' : 'Create Service'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveServiceId !== null} onOpenChange={(open) => { if (!open) setArchiveServiceId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Service</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the service from the public booking calendar. Historical records will be preserved. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchive}
                className="bg-destructive hover:bg-destructive/90"
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
