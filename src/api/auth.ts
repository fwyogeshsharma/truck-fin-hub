import { apiClient, setAuthToken } from './client';

export interface User {
  id: string;
  userId: string;
  email: string;
  name: string;
  role?: 'load_owner' | 'vehicle_owner' | 'lender' | 'admin' | 'super_admin' | 'load_agent' | 'vehicle_agent';
  company?: string;
  companyLogo?: string;
  userLogo?: string;
}

export interface LoginResponse {
  user: User;
  wallet: any;
  token: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface UpdateRoleData {
  userId: string;
  role: User['role'];
  company?: string;
  companyLogo?: string;
}

export const authAPI = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    setAuthToken(response.token);
    return response;
  },

  async signup(data: SignupData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/signup', data);
    setAuthToken(response.token);
    return response;
  },

  async updateRole(data: UpdateRoleData): Promise<{ user: User }> {
    return apiClient.put('/auth/role', data);
  },

  async getMe(): Promise<{ user: User; wallet: any }> {
    return apiClient.get('/auth/me');
  },

  logout() {
    setAuthToken(null);
  },
};

export default authAPI;
