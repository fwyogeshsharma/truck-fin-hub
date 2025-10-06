import { apiClient } from './client';

export interface UserKyc {
  id: string;
  user_id: string;
  pan_number?: string;
  pan_document?: string;
  aadhar_number?: string;
  aadhar_document?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address_proof_type?: 'aadhar' | 'passport' | 'voter_id' | 'driving_license' | 'utility_bill';
  address_proof_document?: string;
  gst_number?: string;
  gst_certificate?: string;
  company_registration_number?: string;
  company_registration_document?: string;
  vehicle_registration_number?: string;
  vehicle_registration_document?: string;
  vehicle_insurance_document?: string;
  vehicle_fitness_certificate?: string;
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export const kycAPI = {
  async getAll(filters?: { status?: string }): Promise<UserKyc[]> {
    const params = new URLSearchParams(filters as any).toString();
    return apiClient.get(`/kyc${params ? `?${params}` : ''}`);
  },

  async getStats(): Promise<{ pendingCount: number; underReviewCount: number }> {
    return apiClient.get('/kyc/stats');
  },

  async getById(id: string): Promise<UserKyc> {
    return apiClient.get(`/kyc/${id}`);
  },

  async getByUser(userId: string): Promise<UserKyc> {
    return apiClient.get(`/kyc/user/${userId}`);
  },

  async checkStatus(userId: string): Promise<{ approved: boolean }> {
    return apiClient.get(`/kyc/user/${userId}/status`);
  },

  async createOrUpdate(data: Partial<UserKyc> & { user_id: string }): Promise<UserKyc> {
    return apiClient.post('/kyc', data);
  },

  async update(userId: string, data: Partial<UserKyc>): Promise<UserKyc> {
    return apiClient.put(`/kyc/user/${userId}`, data);
  },

  async submit(userId: string): Promise<UserKyc> {
    return apiClient.post(`/kyc/user/${userId}/submit`, {});
  },

  async approve(userId: string, verifiedBy: string): Promise<UserKyc> {
    return apiClient.post(`/kyc/user/${userId}/approve`, { verifiedBy });
  },

  async reject(userId: string, verifiedBy: string, rejectionReason: string): Promise<UserKyc> {
    return apiClient.post(`/kyc/user/${userId}/reject`, { verifiedBy, rejectionReason });
  },
};

export default kycAPI;
