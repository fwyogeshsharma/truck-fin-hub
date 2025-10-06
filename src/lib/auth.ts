// Authentication utilities using API

import { authAPI, type User as APIUser } from '../api/auth';

export interface User {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role?: 'load_owner' | 'vehicle_owner' | 'lender' | 'admin' | 'super_admin' | 'load_agent' | 'vehicle_agent';
  company?: string;
  companyLogo?: string;
  userLogo?: string;
}

const AUTH_KEY = 'current_user';
const WALLET_KEY = 'current_wallet';

export const auth = {
  // Get current user
  getCurrentUser: (): User | null => {
    const authData = localStorage.getItem(AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  },

  // Login
  login: async (email: string, password: string): Promise<User> => {
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
      localStorage.setItem(WALLET_KEY, JSON.stringify(response.wallet));
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Signup
  signup: async (email: string, password: string, name: string, phone?: string): Promise<User> => {
    try {
      const response = await authAPI.signup({
        email,
        password,
        name,
        phone: phone || '0000000000', // Default phone if not provided
      });
      localStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
      localStorage.setItem(WALLET_KEY, JSON.stringify(response.wallet));
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  },

  // Logout
  logout: () => {
    authAPI.logout();
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(WALLET_KEY);
  },

  // Update user role (one-time selection)
  updateUserRole: async (role: User['role'], company?: string, companyLogo?: string): Promise<User | null> => {
    const user = auth.getCurrentUser();
    if (!user) return null;

    try {
      const response = await authAPI.updateRole({
        userId: user.id,
        role,
        company,
        companyLogo,
      });

      localStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update role');
    }
  },

  // Get all users (for compatibility - now returns empty array)
  getAllUsers: (): User[] => {
    // This is kept for backward compatibility
    // In the new system, user listing is done via API with proper authentication
    return [];
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!auth.getCurrentUser();
  },

  // Initialize mock users (deprecated - now handled by database)
  initializeMockUsers: () => {
    // Mock users are now in the database
    // This function is kept for backward compatibility but does nothing
    console.log('Mock users are now managed by the database');
  },
};
