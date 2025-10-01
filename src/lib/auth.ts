// Authentication utilities using localStorage

export interface User {
  id: string;
  email: string;
  name: string;
  role?: 'load_owner' | 'transporter' | 'lender' | 'admin';
}

const AUTH_KEY = 'logistics_auth';
const USERS_KEY = 'logistics_users';

export const auth = {
  // Get current user
  getCurrentUser: (): User | null => {
    const authData = localStorage.getItem(AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  },

  // Login
  login: (email: string, password: string): User | null => {
    const users = auth.getAllUsers();
    const user = users.find(u => u.email === email);
    
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  // Signup
  signup: (email: string, password: string, name: string): User => {
    const users = auth.getAllUsers();
    
    // Check if user exists
    if (users.some(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    
    return newUser;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  // Update user role (one-time selection)
  updateUserRole: (role: User['role']) => {
    const user = auth.getCurrentUser();
    if (!user) return null;

    const updatedUser = { ...user, role };
    
    // Update in auth
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    
    // Update in users list
    const users = auth.getAllUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return updatedUser;
  },

  // Get all users
  getAllUsers: (): User[] => {
    const usersData = localStorage.getItem(USERS_KEY);
    return usersData ? JSON.parse(usersData) : [];
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!auth.getCurrentUser();
  },
};
