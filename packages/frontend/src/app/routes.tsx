import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './components/RootLayout';
import { LoginPage } from './pages/LoginPage';
import { ClientDashboard } from './pages/ClientDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { BookAppointmentPage } from './pages/BookAppointmentPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { CalendarPage } from './pages/CalendarPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProcessRequestsPage } from './pages/ProcessRequestsPage';
import { ServiceManagementPage } from './pages/ServiceManagementPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { ProfilePage } from './pages/ProfilePage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />
      },
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'dashboard',
        element: <ClientDashboard />
      },
      {
        path: 'staff-dashboard',
        element: <StaffDashboard />
      },
      {
        path: 'book',
        element: <BookAppointmentPage />
      },
      {
        path: 'confirmation/:trackingNumber',
        element: <ConfirmationPage />
      },
      {
        path: 'appointments',
        element: <MyAppointmentsPage />
      },
      {
        path: 'calendar',
        element: <CalendarPage />
      },
      {
        path: 'notifications',
        element: <NotificationsPage />
      },
      {
        path: 'process',
        element: <ProcessRequestsPage />
      },
      {
        path: 'services',
        element: <ServiceManagementPage />
      },
      {
        path: 'staff',
        element: <StaffManagementPage />
      },
      {
        path: 'profile',
        element: <ProfilePage />
      }
    ]
  }
]);