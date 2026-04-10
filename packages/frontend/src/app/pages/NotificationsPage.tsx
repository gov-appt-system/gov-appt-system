import { Bell, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

export function NotificationsPage() {
  const notifications = INITIAL_NOTIFICATIONS;

  const getIcon = (type: string) => {
    switch (type) {
      case 'confirmation':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'reminder':
        return <Clock size={20} className="text-blue-600" />;
      case 'update':
        return <AlertCircle size={20} className="text-yellow-600" />;
      case 'cancellation':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-[var(--gov-secondary)] mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your appointment status</p>
        </div>

        <Card className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <p className="text-gray-700">{notification.message}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
              )}
            </div>
          ))}
        </Card>
      </div>
    </DashboardLayout>
  );
}
