import { apiClient } from './client';
import { Transaction } from '../lib/data';

export interface CreateTransactionData {
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  category: 'investment' | 'return' | 'payment' | 'refund' | 'fee' | 'withdrawal';
  description: string;
  balance_after: number;
}

export const transactionsAPI = {
  async getAll(filters?: { userId?: string; type?: string; category?: string; limit?: number }): Promise<Transaction[]> {
    const params = new URLSearchParams(filters as any).toString();
    return apiClient.get(`/transactions${params ? `?${params}` : ''}`);
  },

  async getById(id: string): Promise<Transaction> {
    return apiClient.get(`/transactions/${id}`);
  },

  async create(data: CreateTransactionData): Promise<Transaction> {
    return apiClient.post('/transactions', data);
  },

  async getRecent(userId: string, limit: number = 10): Promise<Transaction[]> {
    return apiClient.get(`/transactions/user/${userId}/recent?limit=${limit}`);
  },

  async getStats(userId: string): Promise<{ count: number; totalCredited: number; totalDebited: number; netAmount: number }> {
    return apiClient.get(`/transactions/user/${userId}/stats`);
  },
};

export default transactionsAPI;
