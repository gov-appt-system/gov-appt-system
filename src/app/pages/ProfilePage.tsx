import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ProfilePage() {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    watch,
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
    },
  });

  // Watch for field changes
  const watchedFields = watch();

  useEffect(() => {
    if (isEditing) {
      const initialValues = {
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
      };

      const hasFieldChanges =
        watchedFields.fullName !== initialValues.fullName ||
        watchedFields.email !== initialValues.email ||
        watchedFields.phone !== initialValues.phone ||
        watchedFields.address !== initialValues.address;

      setHasChanges(hasFieldChanges);
    }
  }, [watchedFields, isEditing, user]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    watch: watchPassword,
    reset,
  } = useForm<PasswordFormData>();

  const onUpdateProfile = async (data: ProfileFormData) => {
    setUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setChangingPassword(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Password changed successfully!');
      reset();
      setShowPasswordModal(false);
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 bg-[var(--gov-primary)] rounded-full flex items-center justify-center text-white">
              <User size={40} />
            </div>
            <div>
              <h2 className="text-2xl text-[var(--gov-secondary)]">{user?.name}</h2>
              <p className="text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="fullName"
                    className="pl-10"
                    disabled={!isEditing}
                    {...registerProfile('fullName', { required: 'Full name is required' })}
                  />
                </div>
                {profileErrors.fullName && (
                  <p className="text-sm text-red-600">{profileErrors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    disabled={!isEditing}
                    {...registerProfile('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                </div>
                {profileErrors.email && (
                  <p className="text-sm text-red-600">{profileErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="phone"
                    placeholder="09123456789"
                    className="pl-10"
                    disabled={!isEditing}
                    {...registerProfile('phone')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="address"
                    placeholder="City, Province"
                    className="pl-10"
                    disabled={!isEditing}
                    {...registerProfile('address')}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <Lock size={16} className="mr-2" />
                    Change Password
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={updating || !hasChanges}
                    className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
                  >
                    {updating ? 'Updating...' : 'Update Profile'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>
        </Card>

        {/* Change Password Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new password.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    className="pl-10"
                    {...registerPassword('currentPassword', {
                      required: 'Current password is required',
                    })}
                  />
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    className="pl-10"
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="pl-10"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === watchPassword('newPassword') || 'Passwords do not match',
                    })}
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-[var(--gov-primary)] hover:bg-[var(--gov-primary)]/90"
                >
                  {changingPassword ? 'Changing...' : 'Update Password'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update Confirmation Modal */}
        <AlertDialog open={showUpdateConfirmation} onOpenChange={setShowUpdateConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Update</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to update your profile?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowUpdateConfirmation(false);
                  resetProfile();
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowUpdateConfirmation(false);
                  handleSubmitProfile(onUpdateProfile)();
                }}
              >
                Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}