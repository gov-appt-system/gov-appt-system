import axios, { AxiosInstance, AxiosError } from 'axios';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'staff' | 'manager' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Backend appointment model (camelCase from API)
export interface BackendAppointment {
  id: string;
  trackingNumber: string;
  clientId: string;
  serviceId: string;
  dateTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  personalDetails: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    address: string;
    dateOfBirth: string;
    governmentId: string;
  };
  requiredDocuments: string[];
  remarks?: string;
  processedBy?: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Backend service model (camelCase from API)
export interface BackendService {
  id: string;
  name: string;
  description: string;
  department: string;
  duration: number;
  capacity: number;
  operatingHours: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  requiredDocuments: string[];
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Backend assignment model (camelCase from API)
export interface BackendAssignment {
  id: string;
  staffId: string;
  serviceId: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy: string;
  archivedAt?: string | null;
  archivedBy?: string | null;
  staff?: {
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
    email: string;
  } | null;
}

// Legacy types kept for backward compatibility with other pages
export interface Service {
  id: string;
  name: string;
  description: string;
  department: string;
  businessHours: string;
  requiresDocuments: boolean;
}

export interface Appointment {
  id: string;
  trackingNumber: string;
  service: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
  createdAt: string;
}

export interface AppointmentFormData {
  serviceId: string;
  date: string;
  time: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  documents?: File[];
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  governmentId: string;
  password: string;
}

// Mock data for demo purposes (simulating API responses)
const MOCK_USERS: Array<User & { password: string }> = [
  { id: '1', name: 'John Citizen', email: 'client@gov.ph', password: 'client123', role: 'client' },
  { id: '2', name: 'Maria Staff', email: 'staff@gov.ph', password: 'staff123', role: 'staff' },
  { id: '3', name: 'Carlos Manager', email: 'manager@gov.ph', password: 'manager123', role: 'manager' },
  { id: '4', name: 'Admin User', email: 'admin@gov.ph', password: 'admin123', role: 'admin' },
];

// ── Auth API (mock — kept as-is for login) ──────────────────
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const { password, ...userWithoutPassword } = user;
    const token = `mock-token-${user.id}`;

    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));

    return {
      user: userWithoutPassword,
      token,
    };
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  register: async (data: RegisterData): Promise<{ user: User }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const existing = MOCK_USERS.find(u => u.email === data.email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: 'client',
    };
    MOCK_USERS.push({ ...newUser, password: data.password });
    return { user: newUser };
  },

  forgotPassword: async (email: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    console.log(`[mock] Password reset email sent to ${email}`);
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    if (!token) throw new Error('Invalid or expired reset token.');
    console.log(`[mock] Password reset with token ${token}, new password length: ${newPassword.length}`);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// ── Appointment API (real backend calls) ────────────────────
export const realAppointmentAPI = {
  /** GET /api/appointments — list appointments (role-filtered by backend) */
  getAll: async (params?: { status?: string; serviceId?: string; search?: string }): Promise<BackendAppointment[]> => {
    const { data } = await apiClient.get<BackendAppointment[]>('/appointments', { params });
    return data;
  },

  /** GET /api/appointments/:id */
  getById: async (id: string): Promise<BackendAppointment> => {
    const { data } = await apiClient.get<BackendAppointment>(`/appointments/${id}`);
    return data;
  },

  /** PUT /api/appointments/:id — update status / remarks (staff/manager) */
  update: async (id: string, payload: { status?: string; remarks?: string }): Promise<BackendAppointment> => {
    const { data } = await apiClient.put<BackendAppointment>(`/appointments/${id}`, payload);
    return data;
  },
};

// ── Service API (real backend calls) ────────────────────────
export const realServiceAPI = {
  /** GET /api/services — list active services */
  getAll: async (): Promise<BackendService[]> => {
    const { data } = await apiClient.get<BackendService[]>('/services');
    return data;
  },

  /** GET /api/services/:id */
  getById: async (id: string): Promise<BackendService> => {
    const { data } = await apiClient.get<BackendService>(`/services/${id}`);
    return data;
  },

  /** POST /api/services — create service (manager only) */
  create: async (payload: {
    name: string;
    description: string;
    department: string;
    duration: number;
    capacity: number;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    requiredDocuments: string[];
  }): Promise<BackendService> => {
    const { data } = await apiClient.post<BackendService>('/services', payload);
    return data;
  },

  /** PUT /api/services/:id — update service (manager only) */
  update: async (id: string, payload: Partial<{
    name: string;
    description: string;
    department: string;
    duration: number;
    capacity: number;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    requiredDocuments: string[];
  }>): Promise<BackendService> => {
    const { data } = await apiClient.put<BackendService>(`/services/${id}`, payload);
    return data;
  },

  /** DELETE /api/services/:id — soft-archive (manager only) */
  archive: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/services/${id}`);
    return data;
  },
};

// ── Assignment API (real backend calls) ─────────────────────
export const assignmentAPI = {
  /** GET /api/services/:serviceId/assignments */
  getByService: async (serviceId: string): Promise<BackendAssignment[]> => {
    const { data } = await apiClient.get<BackendAssignment[]>(`/services/${serviceId}/assignments`);
    return data;
  },

  /** POST /api/services/:serviceId/assignments — assign staff */
  create: async (serviceId: string, staffId: string): Promise<BackendAssignment> => {
    const { data } = await apiClient.post<BackendAssignment>(`/services/${serviceId}/assignments`, { staffId });
    return data;
  },

  /** DELETE /api/services/:serviceId/assignments/:assignmentId — remove assignment */
  remove: async (serviceId: string, assignmentId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/services/${serviceId}/assignments/${assignmentId}`);
    return data;
  },
};

// ── Legacy mock APIs (kept for pages not yet migrated) ──────
export const appointmentAPI = {
  create: async (data: AppointmentFormData): Promise<Appointment> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const trackingNumber = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const appointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      trackingNumber,
      service: data.serviceId,
      serviceId: data.serviceId,
      date: data.date,
      time: data.time,
      status: 'pending',
      clientName: data.fullName,
      clientEmail: data.email,
      clientPhone: data.phone,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    return appointment;
  },

  getAll: async (): Promise<Appointment[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.parse(localStorage.getItem('appointments') || '[]');
  },

  getByTrackingNumber: async (trackingNumber: string): Promise<Appointment | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    return appointments.find((a: Appointment) => a.trackingNumber === trackingNumber) || null;
  },

  updateStatus: async (id: string, status: Appointment['status']): Promise<Appointment> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const index = appointments.findIndex((a: Appointment) => a.id === id);
    if (index === -1) throw new Error('Appointment not found');
    appointments[index].status = status;
    localStorage.setItem('appointments', JSON.stringify(appointments));
    return appointments[index];
  },

  getById: async (id: string): Promise<Appointment | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const appointments: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
    return appointments.find((a: Appointment) => a.id === id) || null;
  },

  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const filtered = appointments.filter((a: Appointment) => a.id !== id);
    localStorage.setItem('appointments', JSON.stringify(filtered));
  },
};

export const serviceAPI = {
  getAll: async (): Promise<Service[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      { id: 'birth-cert', name: 'Birth Certificate', description: 'Request for civil registry document - Birth Certificate', department: 'Civil Registry', businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM', requiresDocuments: true },
      { id: 'marriage-cert', name: 'Marriage Certificate', description: 'Request for civil registry document - Marriage Certificate', department: 'Civil Registry', businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM', requiresDocuments: true },
      { id: 'business-permit', name: 'Business Permit', description: 'Application for new or renewal of business permit', department: 'Business Affairs', businessHours: 'Mon-Fri, 9:00 AM - 4:00 PM', requiresDocuments: true },
      { id: 'barangay-clearance', name: 'Barangay Clearance', description: 'Certificate of residency from barangay office', department: 'Barangay Affairs', businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM', requiresDocuments: false },
      { id: 'cedula', name: 'Community Tax Certificate (Cedula)', description: 'Individual or corporate community tax certificate', department: 'Treasury', businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM', requiresDocuments: false },
    ];
  },

  getById: async (id: string): Promise<Service | null> => {
    const services = await serviceAPI.getAll();
    return services.find(s => s.id === id) || null;
  },
};

export default apiClient;
