import { apiClient } from './client';
import { Investment } from '../lib/data';

export interface CreateInvestmentData {
  lender_id: string;
  trip_id: string;
  amount: number;
  interest_rate: number;
  expected_return: number;
  maturity_date: string;
}

export const investmentsAPI = {
  async getAll(filters?: { lenderId?: string; tripId?: string; status?: string }): Promise<Investment[]> {
    const params = new URLSearchParams(filters as any).toString();
    return apiClient.get(`/investments${params ? `?${params}` : ''}`);
  },

  async getById(id: string): Promise<Investment> {
    return apiClient.get(`/investments/${id}`);
  },

  async create(data: CreateInvestmentData): Promise<Investment> {
    return apiClient.post('/investments', data);
  },

  async update(id: string, data: Partial<Investment>): Promise<Investment> {
    return apiClient.put(`/investments/${id}`, data);
  },

  async updateStatus(id: string, status: Investment['status']): Promise<Investment> {
    return apiClient.put(`/investments/${id}/status`, { status });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/investments/${id}`);
  },

  async getStats(lenderId: string): Promise<{ activeCount: number; totalInvested: number; totalReturns: number }> {
    return apiClient.get(`/investments/stats/${lenderId}`);
  },
};

export default investmentsAPI;
