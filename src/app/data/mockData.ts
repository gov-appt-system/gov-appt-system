export interface Service {
  id: string;
  name: string;
  description: string;
  department: string;
  operatingDays: string[];
  businessHours: string;
  maxDailySlots: number;
  requiredDocuments: string[];
}

export interface Appointment {
  id: string;
  trackingNumber: string;
  clientId: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  staffRemarks?: string;
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Birth Certificate Request',
    description: 'Request for authenticated copy of birth certificate',
    department: 'Civil Registry',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: '8:00 AM - 5:00 PM',
    maxDailySlots: 20,
    requiredDocuments: ['Valid ID', 'Authorization Letter (if representative)']
  },
  {
    id: '2',
    name: 'Business Permit Application',
    description: 'New business permit application and renewal',
    department: 'Business Affairs',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: '8:00 AM - 5:00 PM',
    maxDailySlots: 15,
    requiredDocuments: ['DTI Registration', 'Barangay Clearance', 'Valid ID']
  },
  {
    id: '3',
    name: 'Tax Declaration',
    description: 'Property tax declaration and payment',
    department: 'Treasury Office',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: '8:00 AM - 4:00 PM',
    maxDailySlots: 25,
    requiredDocuments: ['Property Title', 'Previous Tax Receipt', 'Valid ID']
  },
  {
    id: '4',
    name: 'Cedula Application',
    description: 'Community tax certificate application',
    department: 'Treasury Office',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: '8:00 AM - 5:00 PM',
    maxDailySlots: 30,
    requiredDocuments: ['Valid ID', 'Proof of Address']
  },
  {
    id: '5',
    name: 'Building Permit',
    description: 'Application for construction and building permits',
    department: 'Engineering Office',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    businessHours: '8:00 AM - 5:00 PM',
    maxDailySlots: 10,
    requiredDocuments: ['Building Plans', 'Lot Title', 'Tax Declaration', 'Valid ID']
  }
];

export const TIME_SLOTS: TimeSlot[] = [
  { time: '8:00 AM', available: true },
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '1:00 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: true },
  { time: '4:00 PM', available: true },
];

// Sample appointments
export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    trackingNumber: 'APT-2026-0001',
    clientId: '1',
    clientName: 'John Citizen',
    service: 'Birth Certificate Request',
    date: '2026-03-15',
    time: '9:00 AM',
    status: 'confirmed',
    notes: 'Need authenticated copy',
    createdAt: '2026-03-10T10:00:00'
  },
  {
    id: '2',
    trackingNumber: 'APT-2026-0002',
    clientId: '1',
    clientName: 'John Citizen',
    service: 'Cedula Application',
    date: '2026-03-20',
    time: '2:00 PM',
    status: 'pending',
    notes: 'First time applicant',
    createdAt: '2026-03-11T14:00:00'
  }
];

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'confirmation' | 'reminder' | 'update' | 'cancellation';
}

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    message: 'Your appointment APT-2026-0001 has been confirmed',
    timestamp: '2026-03-11T09:00:00',
    read: false,
    type: 'confirmation'
  },
  {
    id: '2',
    message: 'Reminder: Appointment tomorrow at 9:00 AM',
    timestamp: '2026-03-14T08:00:00',
    read: false,
    type: 'reminder'
  }
];
