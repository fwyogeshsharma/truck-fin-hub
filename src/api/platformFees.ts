import { apiClient } from './client';

export interface PlatformFeeInput {
  trip_id: string;
  lender_id: string;
  lender_name: string;
  borrower_id: string;
  borrower_name: string;
  loan_amount: number;
  fee_percentage: number;
  fee_amount: number;
  super_admin_transaction_id?: string;
  borrower_transaction_id?: string;
}

export const platformFeesAPI = {
  create: async (data: PlatformFeeInput) => {
    return apiClient.post('/platform-fees', data);
  },

  getAll: async () => {
    return apiClient.get('/platform-fees');
  },

  getStats: async () => {
    return apiClient.get('/platform-fees/stats');
  },

  getByTrip: async (tripId: string) => {
    return apiClient.get(`/platform-fees/trip/${tripId}`);
  },

  getByLender: async (lenderId: string) => {
    return apiClient.get(`/platform-fees/lender/${lenderId}`);
  },

  getByBorrower: async (borrowerId: string) => {
    return apiClient.get(`/platform-fees/borrower/${borrowerId}`);
  },
};
