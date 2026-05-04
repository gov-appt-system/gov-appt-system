// ============================================================
// Enums
// ============================================================

export enum UserRole {
  CLIENT = 'client',
  STAFF = 'staff',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  EXPIRED = 'expired',
}

// ============================================================
// Notification Models
// ============================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================
// User Models
// ============================================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client extends User {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: Date;
  governmentId: string;
}

export interface Staff extends User {
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  assignedServices: string[]; // Service IDs via service_assignments
}

export interface Manager extends User {
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
}

export interface Admin extends User {
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
}

// ============================================================
// Appointment Models
// ============================================================

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  dateOfBirth: Date;
  governmentId: string;
  emergencyContact?: EmergencyContact;
}

export interface Appointment {
  id: string;
  trackingNumber: string;
  clientId: string;
  serviceId: string;
  dateTime: Date;
  duration: number; // minutes
  status: AppointmentStatus;
  personalDetails: PersonalDetails;
  requiredDocuments: string[];
  remarks?: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  processedBy?: string; // Staff ID
}

// ============================================================
// Service Models
// ============================================================

export interface ServiceHours {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  daysOfWeek: number[]; // 0=Sunday … 6=Saturday
  capacity: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  department: string;
  duration: number; // minutes per slot
  capacity: number; // max concurrent appointments per slot
  operatingHours: ServiceHours;
  requiredDocuments: string[];
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Manager ID
}

export interface ServiceAssignment {
  id: string;
  staffId: string;
  serviceId: string;
  isActive: boolean;
  assignedAt: Date;
  assignedBy: string;       // Manager ID
  archivedAt: Date | null;
  archivedBy: string | null; // Manager ID who removed the assignment
}

// ============================================================
// Calendar / Availability Models
// ============================================================

export interface TimeSlot {
  dateTime: Date;
  available: boolean;
  capacity: number;
  booked: number;
}

// ============================================================
// Audit Log Models
// ============================================================

export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}
