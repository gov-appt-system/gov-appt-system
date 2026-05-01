import { Bell } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/card';

export function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your appointment status</p>
        </div>

        <Card className="p-12 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-1">
            You'll receive notifications here when your appointment status changes.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
