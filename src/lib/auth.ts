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
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
}

const AUTH_KEY = 'current_user';
const WALLET_KEY = 'current_wallet';

export const auth = {
  // Get current user (from sessionStorage - tab-specific)
  getCurrentUser: (): User | null => {
    const authData = sessionStorage.getItem(AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  },

  // Login
  login: async (email: string, password: string): Promise<User> => {
    try {
      const response = await authAPI.login(email, password);
      // Store in sessionStorage (tab-specific)
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
      sessionStorage.setItem(WALLET_KEY, JSON.stringify(response.wallet));
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
      // Store in sessionStorage (tab-specific)
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
      sessionStorage.setItem(WALLET_KEY, JSON.stringify(response.wallet));
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  },

  // Logout
  logout: () => {
    authAPI.logout();
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(WALLET_KEY);
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

      // Store in sessionStorage (tab-specific)
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
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

  // Accept terms and conditions
  acceptTerms: async (userId: string): Promise<User> => {
    try {
      const response = await authAPI.acceptTerms(userId);
      // Update sessionStorage with the new user data
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(response.user));
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to accept terms');
    }
  },

  // Check if user has accepted terms
  hasAcceptedTerms: (): boolean => {
    const user = auth.getCurrentUser();
    return user?.termsAccepted === true;
  },
};
