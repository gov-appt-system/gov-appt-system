import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './components/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
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
import { AdminAccountsPage } from './pages/AdminAccountsPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AppointmentDetailPage } from './pages/AppointmentDetailPage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      /* ── Public routes ── */
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },

      /* ── Authenticated routes ── */
      {
        element: <ProtectedRoute />,
        children: [
          /* Routes accessible to all authenticated users */
          {
            path: 'calendar',
            element: <CalendarPage />,
          },
          {
            path: 'notifications',
            element: <NotificationsPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },

          /* ── Client-only routes ── */
          {
            element: <RoleGuard allowedRoles={['client']} />,
            children: [
              {
                path: 'dashboard',
                element: <ClientDashboard />,
              },
              {
                path: 'book',
                element: <BookAppointmentPage />,
              },
              {
                path: 'confirmation/:trackingNumber',
                element: <ConfirmationPage />,
              },
              {
                path: 'appointments',
                element: <MyAppointmentsPage />,
              },
              {
                path: 'appointments/:id',
                element: <AppointmentDetailPage />,
              },
            ],
          },

          /* ── Staff / Manager / Admin routes ── */
          {
            element: <RoleGuard allowedRoles={['staff', 'manager', 'admin']} />,
            children: [
              {
                path: 'staff-dashboard',
                element: <StaffDashboard />,
              },
              {
                path: 'process',
                element: <ProcessRequestsPage />,
              },
            ],
          },

          /* ── Manager / Admin routes ── */
          {
            element: <RoleGuard allowedRoles={['manager', 'admin']} />,
            children: [
              {
                path: 'services',
                element: <ServiceManagementPage />,
              },
            ],
          },

          /* ── Admin-only routes ── */
          {
            element: <RoleGuard allowedRoles={['admin']} />,
            children: [
              {
                path: 'staff',
                element: <StaffManagementPage />,
              },
              {
                path: 'admin/accounts',
                element: <AdminAccountsPage />,
              },
              {
                path: 'admin/clients',
                element: <AdminClientsPage />,
              },
              {
                path: 'admin/audit-logs',
                element: <AuditLogsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
