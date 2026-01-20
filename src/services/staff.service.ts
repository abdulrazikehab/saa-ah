import { apiClient } from './core/api-client';

export interface StaffUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  staffPermissions: {
    permission: string;
    grantedAt: string;
    grantedBy: string;
    grantedByUser?: {
      email: string;
    };
  }[];
}

export interface CreateStaffDto {
  email: string;
  phone?: string;
  role?: string;
  permissions: string[];
  assignedCustomers?: string[];
}

export const staffService = {
  getStaffUsers: (page: number = 1, limit: number = 50): Promise<{ data: StaffUser[]; meta: any }> =>
    apiClient.fetch(`${apiClient.authUrl}/staff?page=${page}&limit=${limit}`, {
      requireAuth: true,
    }),

  getStaffUser: (id: string): Promise<StaffUser> =>
    apiClient.fetch(`${apiClient.authUrl}/staff/${id}`, {
      requireAuth: true,
    }),

  getAvailablePermissions: (): Promise<string[]> =>
    apiClient.fetch(`${apiClient.authUrl}/staff/permissions`, {
      requireAuth: true,
    }),

  createStaff: (data: CreateStaffDto): Promise<StaffUser> =>
    apiClient.fetch(`${apiClient.authUrl}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updatePermissions: (id: string, permissions: string[]): Promise<{ message: string; permissions: string[] }> =>
    apiClient.fetch(`${apiClient.authUrl}/staff/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
      requireAuth: true,
    }),

  deleteStaff: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.authUrl}/staff/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
};
