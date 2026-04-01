# Government Appointment Booking System - Tech Stack Implementation

## Overview
This document outlines the complete implementation of the specified technology stack for the Government Appointment Booking System.

## Technology Stack

### 1. React 18 with TypeScript
- **Version**: React 18.3.1
- **TypeScript**: Fully implemented with type safety across all components
- **Type Definitions**: 
  - Interface definitions for all data models (User, Appointment, Service, etc.)
  - Strongly typed props for all components
  - Type-safe API responses

### 2. shadcn/ui Component Library
- **Implementation**: Complete migration to shadcn/ui components
- **Components Used**:
  - `Button` - All buttons throughout the application
  - `Input` - Form inputs with validation
  - `Label` - Form labels
  - `Card` - Content containers
  - `Dialog` - Modal dialogs
  - `Select` - Dropdown selections
  - `Textarea` - Multi-line text inputs
  - `Toaster` - Toast notifications (via Sonner)

### 3. Tailwind CSS
- **Version**: Tailwind CSS 4.1.12
- **Configuration**: Utility-first styling approach
- **Custom CSS Variables**: Government color palette maintained
  - `--gov-primary`: #3e7d60 (Primary green)
  - `--gov-secondary`: #1c2d5c (Navy blue)
  - `--gov-accent`: #c7e1d5 (Accent green)
  - `--gov-bg`: #eef8fe (Background)
  - `--gov-highlight`: #f7f7d5 (Highlights)

### 4. React Router
- **Version**: React Router 7.13.0
- **Implementation**: Client-side routing with `createBrowserRouter`
- **Routes**:
  - `/login` - Authentication
  - `/dashboard` - Client Dashboard
  - `/staff-dashboard` - Staff Dashboard
  - `/book` - Book Appointment (multi-step form)
  - `/appointments` - My Appointments
  - `/track` - Track Appointment
  - `/calendar` - Calendar View
  - `/notifications` - Notifications
  - `/process` - Process Requests (Staff)
  - `/services` - Service Management (Admin)
  - `/staff` - Staff Management (Admin)
  - `/profile` - User Profile
  - `/confirmation/:trackingNumber` - Appointment Confirmation

### 5. Axios for API Communication
- **Version**: 1.13.6
- **Implementation**: Centralized API service layer
- **Features**:
  - Axios instance with default configuration
  - Request interceptors for authentication (Bearer token)
  - Response interceptors for error handling
  - Automatic 401 redirect to login
  - Mock API endpoints for demo purposes

**API Service Structure** (`/src/app/services/api.ts`):
```typescript
// Authentication API
authAPI.login(credentials)
authAPI.logout()
authAPI.getCurrentUser()

// Appointment API
appointmentAPI.create(data)
appointmentAPI.getAll()
appointmentAPI.getByTrackingNumber(trackingNumber)
appointmentAPI.updateStatus(id, status)
appointmentAPI.delete(id)

// Service API
serviceAPI.getAll()
serviceAPI.getById(id)
```

### 6. React Hook Form
- **Version**: 7.55.0
- **Implementation**: Form validation and management
- **Features**:
  - Declarative form validation
  - Built-in error handling
  - TypeScript integration
  - Performance optimization (minimal re-renders)

**Forms Implemented**:
1. **Login Form** (`LoginPage.tsx`)
   - Email validation (pattern matching)
   - Password validation (minimum length)
   - Error state management

2. **Book Appointment Form** (`BookAppointmentPage.tsx`)
   - Multi-step form validation
   - Required field validation
   - Email and phone pattern validation
   - Form submission with axios API

3. **Profile Update Form** (`ProfilePage.tsx`)
   - Profile information update
   - Email validation
   - Default values from user context

4. **Password Change Form** (`ProfilePage.tsx`)
   - Current password validation
   - New password strength validation
   - Confirm password matching validation

5. **Track Appointment Form** (`TrackAppointmentPage.tsx`)
   - Tracking number validation
   - Form submission with API integration

## Key Features

### Authentication & Authorization
- Context-based authentication (`AuthContext.tsx`)
- JWT token storage in localStorage
- Protected routes
- Role-based access (Client, Staff, Manager, Admin)
- Persistent session management

### State Management
- React Context API for global state (Auth)
- Local component state with useState
- Form state with React Hook Form
- API state management with async/await

### API Integration
- Centralized axios configuration
- Mock data for demo purposes
- localStorage-based persistence for demo
- Type-safe API responses
- Error handling with toast notifications

### UI/UX Features
- Toast notifications (Sonner)
- Loading states
- Error states
- Form validation feedback
- Responsive design
- Government portal styling

### Form Validation
- Email pattern validation
- Phone number validation
- Password strength requirements
- Required field validation
- Custom validation rules
- Real-time error feedback

## File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── DashboardLayout.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── pages/
│   │   ├── LoginPage.tsx    # React Hook Form
│   │   ├── BookAppointmentPage.tsx  # Multi-step form
│   │   ├── MyAppointmentsPage.tsx   # Axios API
│   │   ├── TrackAppointmentPage.tsx # React Hook Form + Axios
│   │   ├── ProfilePage.tsx  # React Hook Form
│   │   └── ...
│   ├── services/
│   │   └── api.ts           # Axios configuration & API services
│   ├── App.tsx              # Main app with Toaster
│   └── routes.tsx           # React Router configuration
└── styles/
    ├── index.css
    ├── theme.css            # Government color palette
    └── tailwind.css
```

## Demo Credentials

The system includes mock authentication with the following demo accounts:

| Role     | Email              | Password    |
|----------|-------------------|-------------|
| Client   | client@gov.ph     | client123   |
| Staff    | staff@gov.ph      | staff123    |
| Manager  | manager@gov.ph    | manager123  |
| Admin    | admin@gov.ph      | admin123    |

## API Configuration

The API base URL can be configured via environment variable:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

Default fallback: `http://localhost:3000/api`

## Migration Notes

### Components Migrated to shadcn/ui
- ✅ Button (from custom to shadcn/ui)
- ✅ Input (from custom to shadcn/ui)
- ✅ Card (from custom to shadcn/ui)
- ✅ Label (added from shadcn/ui)
- ✅ Select (added from shadcn/ui)
- ✅ Dialog (added from shadcn/ui)
- ✅ Textarea (added from shadcn/ui)

### Forms Migrated to React Hook Form
- ✅ LoginPage - Email/Password validation
- ✅ BookAppointmentPage - Multi-step form with validation
- ✅ ProfilePage - Profile update & Password change
- ✅ TrackAppointmentPage - Tracking number search

### API Integration
- ✅ Authentication API (login/logout)
- ✅ Appointment API (CRUD operations)
- ✅ Service API (read operations)
- ✅ Axios interceptors for auth & errors
- ✅ Toast notifications for API feedback

## Next Steps for Production

To connect to a real backend API:

1. Update `VITE_API_BASE_URL` environment variable
2. Remove mock data from `api.ts`
3. Implement real API endpoints
4. Add proper error handling for production
5. Implement file upload functionality
6. Add rate limiting and request caching
7. Set up proper CORS configuration

## Design System Maintained

All government portal design specifications have been preserved:
- Color palette (primary green, navy blue, etc.)
- Card-based layout
- Responsive design
- Accessibility features
- Government branding
