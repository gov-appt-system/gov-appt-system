import axios, { AxiosInstance, AxiosError } from 'axios';

// ── API Base Configuration ──────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── Type Definitions ────────────────────────────────────────

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

export interface BackendAppointment {
  id: string;
  trackingNumber: string;
  clientId: string;
  serviceId: string;
  dateTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'expired';
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

export interface StaffAccount {
  userId: string;
  email: string;
  role: 'staff' | 'manager';
  isActive: boolean;
  archivedAt: string | null;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  assignedServices: string[];
}

export interface ClientAccount {
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  address: string | null;
  dateOfBirth: string | null;
  governmentId: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  profile: Record<string, unknown> | null;
}

// ── Auth API ────────────────────────────────────────────────

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await apiClient.post<{ user: { id: string; email: string; role: string }; token: string }>(
      '/auth/login',
      credentials,
    );

    const user: User = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role as User['role'],
      name: data.user.email, // Will be updated after profile fetch
    };

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(user));

    // Fetch full profile to get the real name
    try {
      const profileRes = await apiClient.get<ProfileResponse>('/profile');
      const profile = profileRes.data.profile;
      if (profile) {
        const firstName = (profile.first_name as string) || '';
        const lastName = (profile.last_name as string) || '';
        user.name = `${firstName} ${lastName}`.trim() || user.email;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch {
      // Profile fetch is best-effort; login still succeeds
    }

    return { user, token: data.token };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  register: async (data: RegisterData): Promise<{ user: User }> => {
    const { data: result } = await apiClient.post<{ id: string; email: string; role: string }>(
      '/auth/register',
      {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
        governmentId: data.governmentId,
      },
    );

    const user: User = {
      id: result.id,
      email: result.email,
      role: result.role as User['role'],
      name: `${data.firstName} ${data.lastName}`,
    };

    return { user };
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// ── Appointment API ─────────────────────────────────────────

export const appointmentAPI = {
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

  /** POST /api/appointments — create a new appointment */
  create: async (payload: {
    serviceId: string;
    dateTime: string;
    personalDetails: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email: string;
      address: string;
    };
    requiredDocuments?: string[];
    remarks?: string;
  }): Promise<BackendAppointment> => {
    const { data } = await apiClient.post<BackendAppointment>('/appointments', payload);
    return data;
  },

  /** PUT /api/appointments/:id — update status / remarks (staff/manager) */
  update: async (id: string, payload: { status?: string; remarks?: string }): Promise<BackendAppointment> => {
    const { data } = await apiClient.put<BackendAppointment>(`/appointments/${id}`, payload);
    return data;
  },
};

// ── Service API ─────────────────────────────────────────────

export const serviceAPI = {
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

// ── Assignment API ──────────────────────────────────────────

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

// ── Admin API ───────────────────────────────────────────────

export const adminAPI = {
  /** GET /api/admin/accounts — list staff/manager accounts */
  getAccounts: async (): Promise<StaffAccount[]> => {
    const { data } = await apiClient.get<StaffAccount[]>('/admin/accounts');
    return data;
  },

  /** POST /api/admin/accounts — create staff/manager account */
  createAccount: async (payload: {
    email: string;
    password: string;
    role: 'staff' | 'manager';
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
  }): Promise<StaffAccount> => {
    const { data } = await apiClient.post<StaffAccount>('/admin/accounts', payload);
    return data;
  },

  /** PUT /api/admin/accounts/:id — update staff/manager account */
  updateAccount: async (id: string, payload: Partial<{
    email: string;
    role: 'staff' | 'manager';
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
  }>): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>(`/admin/accounts/${id}`, payload);
    return data;
  },

  /** DELETE /api/admin/accounts/:id — archive staff/manager account */
  archiveAccount: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/admin/accounts/${id}`);
    return data;
  },

  /** GET /api/admin/clients — list client accounts */
  getClients: async (): Promise<ClientAccount[]> => {
    const { data } = await apiClient.get<ClientAccount[]>('/admin/clients');
    return data;
  },

  /** PUT /api/admin/clients/:id — update client account */
  updateClient: async (id: string, payload: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    isActive: boolean;
  }>): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>(`/admin/clients/${id}`, payload);
    return data;
  },

  /** GET /api/admin/audit-logs — fetch audit logs */
  getAuditLogs: async (params?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogEntry[]> => {
    const { data } = await apiClient.get<AuditLogEntry[]>('/admin/audit-logs', { params });
    return data;
  },

  /** GET /api/admin/audit-logs/export — export audit logs as CSV */
  exportAuditLogs: async (startDate: string, endDate: string): Promise<string> => {
    const { data } = await apiClient.get<string>('/admin/audit-logs/export', {
      params: { startDate, endDate },
      responseType: 'text' as any,
    });
    return data;
  },
};

// ── Profile API ─────────────────────────────────────────────

export const profileAPI = {
  /** GET /api/profile — fetch current user's profile */
  get: async (): Promise<ProfileResponse> => {
    const { data } = await apiClient.get<ProfileResponse>('/profile');
    return data;
  },

  /** PUT /api/profile — update current user's profile */
  update: async (payload: Record<string, unknown>): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>('/profile', payload);
    return data;
  },

  /** POST /api/profile/change-password — change password */
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>('/profile/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};

export default apiClient;

// ── Notification Types ──────────────────────────────────────

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ── Notification API ────────────────────────────────────────

export const notificationAPI = {
  /** GET /api/notifications — list notifications for current user */
  getAll: async (params?: { unreadOnly?: boolean; limit?: number }): Promise<AppNotification[]> => {
    const { data } = await apiClient.get<AppNotification[]>('/notifications', { params });
    return data;
  },

  /** GET /api/notifications/unread-count */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },

  /** PUT /api/notifications/:id/read */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  /** PUT /api/notifications/read-all */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },
};
