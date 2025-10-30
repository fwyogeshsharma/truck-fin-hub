// API Client for Truck Finance Hub
// In production (Netlify), use relative /api path which gets proxied to backend
// In development, use /api which gets proxied by Vite dev server
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Use sessionStorage for tokens (tab-specific) instead of localStorage (shared across tabs)
export const setAuthToken = (token: string | null) => {
  if (token) {
    sessionStorage.setItem('auth_token', token);
  } else {
    sessionStorage.removeItem('auth_token');
  }
};

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('auth_token');
};

interface RequestOptions {
  headers?: Record<string, string>;
}

// Custom error class to preserve HTTP status codes
class ApiError extends Error {
  status: number;
  response?: any;

  constructor(message: string, status: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

export const apiClient = {
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.error || error.message || 'Request failed', response.status, error);
    }

    return response.json();
  },

  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.error || error.message || 'Request failed', response.status, error);
    }

    return response.json();
  },

  async put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.error || error.message || 'Request failed', response.status, error);
    }

    return response.json();
  },

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.error || error.message || 'Request failed', response.status, error);
    }

    return response.json();
  },
};

export default apiClient;
