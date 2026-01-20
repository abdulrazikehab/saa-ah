import { apiClient } from './core/api-client';

export interface CustomerEmployee {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

export interface CreateCustomerEmployeeDto {
  email: string;
  name?: string;
  phone?: string;
  password?: string;
  permissions?: string[];
}

export const customerEmployeesService = {
  getCustomerEmployees: (page: number = 1, limit: number = 50): Promise<{ data: CustomerEmployee[]; meta: any }> =>
    apiClient.fetch(`${apiClient.authUrl}/customer-employees?page=${page}&limit=${limit}`, {
      requireAuth: true,
    }),

  getCustomerEmployee: (id: string): Promise<CustomerEmployee> =>
    apiClient.fetch(`${apiClient.authUrl}/customer-employees/${id}`, {
      requireAuth: true,
    }),

  getAvailablePermissions: (): Promise<string[]> =>
    apiClient.fetch(`${apiClient.authUrl}/customer-employees/permissions`, {
      requireAuth: true,
    }),

  createCustomerEmployee: (data: CreateCustomerEmployeeDto): Promise<CustomerEmployee> =>
    apiClient.fetch(`${apiClient.authUrl}/customer-employees`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updatePermissions: (id: string, permissions: string[]): Promise<{ message: string; permissions: string[] }> =>
    apiClient.fetch(`${apiClient.authUrl}/customer-employees/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
      requireAuth: true,
    }),

  deleteCustomerEmployee: (id: string): Promise<void> =>
    apiClient.fetch(`${apiClient.authUrl}/customer-employees/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
};

