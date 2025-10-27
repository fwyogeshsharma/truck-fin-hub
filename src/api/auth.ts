import { apiClient, setAuthToken } from './client';

export interface User {
  id: string;
  userId: string;
  email: string;
  name: string;
  role?: 'load_owner' | 'vehicle_owner' | 'lender' | 'admin' | 'super_admin' | 'load_agent' | 'vehicle_agent';
  company?: string;
  company_id?: string;
  companyLogo?: string;
  userLogo?: string;
  user_type?: 'individual' | 'company';
  approval_status?: 'approved' | 'pending' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  is_admin?: boolean;
  // Lender Financial Profile
  annual_income?: 'below_5L' | '5L_10L' | '10L_25L' | '25L_50L' | 'above_50L';
  investable_surplus?: 'below_1L' | '1L_5L' | '5L_10L' | '10L_25L' | 'above_25L';
  investment_experience?: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  risk_appetite?: 'conservative' | 'moderate' | 'aggressive';
  investment_horizon?: 'short' | 'medium' | 'long' | 'flexible';
  max_investment_per_deal?: 'below_25K' | '25K_50K' | '50K_1L' | '1L_2L' | 'above_2L';
  financial_profile_completed?: boolean;
  financial_profile_updated_at?: string;
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
  companyId?: string;
  companyLogo?: string;
  userType?: 'individual' | 'company';
  approvalStatus?: 'approved' | 'pending' | 'rejected';
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

  async acceptTerms(userId: string): Promise<{ user: User }> {
    return apiClient.put('/auth/accept-terms', { userId });
  },
};

export default authAPI;
