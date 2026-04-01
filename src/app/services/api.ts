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

// Mock data for demo purposes (simulating API responses)
const MOCK_USERS: Array<User & { password: string }> = [
  { id: '1', name: 'John Citizen', email: 'client@gov.ph', password: 'client123', role: 'client' },
  { id: '2', name: 'Maria Staff', email: 'staff@gov.ph', password: 'staff123', role: 'staff' },
  { id: '3', name: 'Carlos Manager', email: 'manager@gov.ph', password: 'manager123', role: 'manager' },
  { id: '4', name: 'Admin User', email: 'admin@gov.ph', password: 'admin123', role: 'admin' },
];

// API Service functions
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('authAPI.login called with:', { email: credentials.email });
    console.log('Available users:', MOCK_USERS.map(u => ({ email: u.email, role: u.role })));
    
    const user = MOCK_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    
    console.log('User found:', user ? 'Yes' : 'No');
    
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export const appointmentAPI = {
  create: async (data: AppointmentFormData): Promise<Appointment> => {
    // Simulate API call
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
    
    // Store in localStorage for demo
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    return appointment;
  },
  
  getAll: async (): Promise<Appointment[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return JSON.parse(localStorage.getItem('appointments') || '[]');
  },
  
  getByTrackingNumber: async (trackingNumber: string): Promise<Appointment | null> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    return appointments.find((a: Appointment) => a.trackingNumber === trackingNumber) || null;
  },
  
  updateStatus: async (id: string, status: Appointment['status']): Promise<Appointment> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const index = appointments.findIndex((a: Appointment) => a.id === id);
    
    if (index === -1) {
      throw new Error('Appointment not found');
    }
    
    appointments[index].status = status;
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    return appointments[index];
  },
  
  delete: async (id: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const filtered = appointments.filter((a: Appointment) => a.id !== id);
    localStorage.setItem('appointments', JSON.stringify(filtered));
  },
};

export const serviceAPI = {
  getAll: async (): Promise<Service[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock services from mockData
    return [
      {
        id: 'birth-cert',
        name: 'Birth Certificate',
        description: 'Request for civil registry document - Birth Certificate',
        department: 'Civil Registry',
        businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM',
        requiresDocuments: true,
      },
      {
        id: 'marriage-cert',
        name: 'Marriage Certificate',
        description: 'Request for civil registry document - Marriage Certificate',
        department: 'Civil Registry',
        businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM',
        requiresDocuments: true,
      },
      {
        id: 'business-permit',
        name: 'Business Permit',
        description: 'Application for new or renewal of business permit',
        department: 'Business Affairs',
        businessHours: 'Mon-Fri, 9:00 AM - 4:00 PM',
        requiresDocuments: true,
      },
      {
        id: 'barangay-clearance',
        name: 'Barangay Clearance',
        description: 'Certificate of residency from barangay office',
        department: 'Barangay Affairs',
        businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM',
        requiresDocuments: false,
      },
      {
        id: 'cedula',
        name: 'Community Tax Certificate (Cedula)',
        description: 'Individual or corporate community tax certificate',
        department: 'Treasury',
        businessHours: 'Mon-Fri, 8:00 AM - 5:00 PM',
        requiresDocuments: false,
      },
    ];
  },
  
  getById: async (id: string): Promise<Service | null> => {
    const services = await serviceAPI.getAll();
    return services.find(s => s.id === id) || null;
  },
};

export default apiClient;