import { apiClient } from './client';
import { BankAccount } from '../lib/data';

export interface CreateBankAccountData {
  user_id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  account_type: 'savings' | 'current';
  is_primary?: boolean;
}

export const bankAccountsAPI = {
  async getByUser(userId: string): Promise<BankAccount[]> {
    return apiClient.get(`/bank-accounts/user/${userId}`);
  },

  async getPrimary(userId: string): Promise<BankAccount> {
    return apiClient.get(`/bank-accounts/user/${userId}/primary`);
  },

  async getVerified(userId: string): Promise<BankAccount[]> {
    return apiClient.get(`/bank-accounts/user/${userId}/verified`);
  },

  async getById(id: string): Promise<BankAccount> {
    return apiClient.get(`/bank-accounts/${id}`);
  },

  async create(data: CreateBankAccountData): Promise<BankAccount> {
    return apiClient.post('/bank-accounts', data);
  },

  async update(id: string, data: Partial<BankAccount>): Promise<BankAccount> {
    return apiClient.put(`/bank-accounts/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/bank-accounts/${id}`);
  },

  async setPrimary(id: string): Promise<BankAccount> {
    return apiClient.put(`/bank-accounts/${id}/set-primary`, {});
  },

  async verify(id: string): Promise<BankAccount> {
    return apiClient.put(`/bank-accounts/${id}/verify`, {});
  },
};

export default bankAccountsAPI;
