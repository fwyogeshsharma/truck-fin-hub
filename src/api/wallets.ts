import { apiClient } from './client';
import { Wallet } from '../lib/data';

interface BankAccountInfo {
  id?: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export const walletsAPI = {
  async get(userId: string): Promise<Wallet> {
    return apiClient.get(`/wallets/${userId}`);
  },

  async update(userId: string, data: Partial<Wallet>): Promise<Wallet> {
    return apiClient.put(`/wallets/${userId}`, data);
  },

  // Create add money request (requires admin verification)
  async requestAddMoney(userId: string, amount: number, transactionImageUrl: string): Promise<any> {
    return apiClient.post('/transaction-requests', {
      user_id: userId,
      request_type: 'add_money',
      amount,
      transaction_image_url: transactionImageUrl,
    });
  },

  // Create withdrawal request (requires admin verification)
  async requestWithdraw(userId: string, amount: number, bankAccount: BankAccountInfo): Promise<any> {
    return apiClient.post('/transaction-requests', {
      user_id: userId,
      request_type: 'withdrawal',
      amount,
      bank_account_id: bankAccount.id,
      bank_account_number: bankAccount.accountNumber,
      bank_ifsc_code: bankAccount.ifscCode,
      bank_name: bankAccount.bankName,
    });
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
