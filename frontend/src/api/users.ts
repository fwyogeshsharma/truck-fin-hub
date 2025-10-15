import { apiClient } from './client';
import { User } from './auth';

export interface CreateUserData {
  user_id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
  role?: User['role'];
  company?: string;
  company_logo?: string;
  user_logo?: string;
}

export const usersAPI = {
  async getAll(filters?: { role?: string }): Promise<Omit<User, 'password_hash'>[]> {
    const params = new URLSearchParams(filters as any).toString();
    return apiClient.get(`/users${params ? `?${params}` : ''}`);
  },

  async getById(id: string): Promise<Omit<User, 'password_hash'>> {
    return apiClient.get(`/users/${id}`);
  },

  async getByEmail(email: string): Promise<Omit<User, 'password_hash'>> {
    return apiClient.get(`/users/email/${email}`);
  },

  async getByUserId(userId: string): Promise<Omit<User, 'password_hash'>> {
    return apiClient.get(`/users/userId/${userId}`);
  },

  async create(data: CreateUserData): Promise<Omit<User, 'password_hash'>> {
    return apiClient.post('/users', data);
  },

  async update(id: string, data: Partial<User>): Promise<Omit<User, 'password_hash'>> {
    return apiClient.put(`/users/${id}`, data);
  },

  async updatePassword(id: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.put(`/users/${id}/password`, { newPassword });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/users/${id}`);
  },
};

export default usersAPI;
