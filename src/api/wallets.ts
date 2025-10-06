import { apiClient } from './client';
import { Wallet } from '../lib/data';

export const walletsAPI = {
  async get(userId: string): Promise<Wallet> {
    return apiClient.get(`/wallets/${userId}`);
  },

  async update(userId: string, data: Partial<Wallet>): Promise<Wallet> {
    return apiClient.put(`/wallets/${userId}`, data);
  },

  async addMoney(userId: string, amount: number): Promise<Wallet> {
    return apiClient.post(`/wallets/${userId}/add-money`, { amount });
  },

  async withdraw(userId: string, amount: number): Promise<Wallet> {
    return apiClient.post(`/wallets/${userId}/withdraw`, { amount });
  },

  async moveToEscrow(userId: string, amount: number): Promise<Wallet> {
    return apiClient.post(`/wallets/${userId}/escrow`, { amount });
  },

  async invest(userId: string, amount: number, tripId?: string): Promise<Wallet> {
    return apiClient.post(`/wallets/${userId}/invest`, { amount, tripId });
  },

  async returnInvestment(userId: string, principal: number, returns: number): Promise<Wallet> {
    return apiClient.post(`/wallets/${userId}/return`, { principal, returns });
  },
};

export default walletsAPI;
