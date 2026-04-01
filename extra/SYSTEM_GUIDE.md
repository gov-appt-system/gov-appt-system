# Government Appointment Booking System - User Guide

## Demo Credentials

Use these credentials to test different user roles:

### Client Account
- **Email:** client@gov.ph
- **Password:** client123
- **Access:** Book appointments, track status, view calendar

### Staff Account
- **Email:** staff@gov.ph
- **Password:** staff123
- **Access:** Process appointment requests, view calendar, manage appointments

### Manager Account
- **Email:** manager@gov.ph
- **Password:** manager123
- **Access:** All staff features plus service management

### Administrator Account
- **Email:** admin@gov.ph
- **Password:** admin123
- **Access:** Full system access including staff management

## Features by Role

### Client Features
- **Dashboard:** View appointment statistics and recent activity
- **Book Appointment:** 4-step booking process (Service → Date → Time → Details)
- **My Appointments:** View, reschedule, or cancel appointments
- **Track Appointment:** Track status using tracking number
- **Appointment Calendar:** View all scheduled appointments
- **Notifications:** Receive appointment updates
- **Profile:** Manage personal information

### Staff Features
- **Dashboard:** View pending requests and today's schedule
- **Process Requests:** Approve or reject appointment requests
- **Calendar:** View all appointments system-wide
- **Notifications:** System notifications
- **Profile:** Manage personal information

### Manager Features
- All Staff features plus:
- **Service Management:** Add, edit, or disable government services

### Administrator Features
- All Manager features plus:
- **Staff Management:** Add, edit, or deactivate staff accounts

## Recommended Demo Flow

1. **Login as Client** (client@gov.ph)
   - View the client dashboard
   - Click "Book New Appointment"
   - Select a service (e.g., "Birth Certificate Request")
   - Choose a date (weekdays only)
   - Select a time slot
   - Fill in personal details
   - Submit appointment
   - Note the tracking number on confirmation page

2. **Track Appointment**
   - Go to "Track Appointment"
   - Enter the tracking number
   - View appointment progress timeline

3. **Logout and Login as Staff** (staff@gov.ph)
   - View the staff dashboard
   - See the pending appointment request
   - Click "Approve" to confirm the appointment

4. **Login as Client Again**
   - View "My Appointments"
   - See the appointment status changed to "Confirmed"
   - Check notifications for confirmation message

5. **Explore Manager Features** (manager@gov.ph)
   - View Service Management
   - See all available government services
   - View operating hours and requirements

6. **Explore Admin Features** (admin@gov.ph)
   - View Staff Management
   - See all staff members and their roles

## Color Scheme

- **Primary Green (#3e7d60):** Primary buttons and highlights
- **Navy Blue (#1c2d5c):** Sidebar and headers
- **Light Green (#c7e1d5):** Accent elements
- **Light Blue (#eef8fe):** Page backgrounds
- **Yellow (#f7f7d5):** Information highlights
- **Red:** Alerts and cancellations

## Status Colors

- **Yellow:** Pending - Awaiting staff approval
- **Green:** Confirmed - Appointment approved
- **Blue:** Completed - Service completed
- **Red:** Cancelled - Appointment cancelled

## Available Services

1. **Birth Certificate Request** - Civil Registry Department
2. **Business Permit Application** - Business Affairs
3. **Tax Declaration** - Treasury Office
4. **Cedula Application** - Treasury Office
5. **Building Permit** - Engineering Office

## Appointment Workflow

1. **Client submits** appointment request
2. **Status: Pending** - Request awaits staff review
3. **Staff reviews** and approves/rejects
4. **Status: Confirmed** - Appointment scheduled
5. **Client attends** appointment
6. **Status: Completed** - Service delivered

## Notes

- Weekends are disabled for appointment booking
- Time slots are from 8:00 AM to 4:00 PM
- Each service has specific operating hours and required documents
- Tracking numbers follow format: APT-YYYY-XXXX
- All data is mock data for demonstration purposes
