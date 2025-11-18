import { apiClient } from './client';
import { Trip } from '../lib/data';

export interface CreateTripData {
  load_owner_id: string;
  load_owner_name: string;
  load_owner_logo?: string;
  load_owner_rating?: number;
  client_company?: string;
  client_logo?: string;
  origin: string;
  destination: string;
  distance: number;
  load_type: string;
  weight: number;
  amount: number;
  maturity_days?: number;
  risk_level?: 'low' | 'medium' | 'high';
  insurance_status?: boolean;
}

export interface AddBidData {
  lenderId: string;
  lenderName: string;
  amount: number;
  interestRate: number;
}

export interface UploadDocumentData {
  documentType: 'bilty' | 'ewaybill' | 'advance_invoice' | 'pod' | 'final_invoice';
  documentData: string;
  uploadedBy: string;
}

export const tripsAPI = {
  async getAll(filters?: { status?: string; loadOwnerId?: string; lenderId?: string; transporterId?: string }): Promise<Trip[]> {
    const params = new URLSearchParams(filters as any).toString();
    return apiClient.get(`/trips${params ? `?${params}` : ''}`);
  },

  async getById(id: string): Promise<Trip> {
    return apiClient.get(`/trips/${id}`);
  },

  async create(data: CreateTripData): Promise<Trip> {
    return apiClient.post('/trips', data);
  },

  async update(id: string, data: Partial<Trip>): Promise<Trip> {
    return apiClient.put(`/trips/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/trips/${id}`);
  },

  async getBids(tripId: string): Promise<any[]> {
    return apiClient.get(`/trips/${tripId}/bids`);
  },

  async addBid(tripId: string, data: AddBidData): Promise<any> {
    return apiClient.post(`/trips/${tripId}/bids`, data);
  },

  async uploadDocument(tripId: string, data: UploadDocumentData): Promise<any> {
    return apiClient.post(`/trips/${tripId}/documents`, data);
  },
};

export default tripsAPI;
