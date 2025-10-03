// Authentication utilities using localStorage

export interface User {
  id: string;
  email: string;
  name: string;
  role?: 'load_owner' | 'transporter' | 'lender' | 'admin' | 'load_agent' | 'vehicle_agent';
  company?: string;
  companyLogo?: string;
}

const AUTH_KEY = 'logistics_auth';
const USERS_KEY = 'logistics_users';

// Initialize mock load agent users
const initializeMockUsers = () => {
  const users = auth.getAllUsers();

  // Check if mock users already exist
  if (!users.find(u => u.email === 'aman@rollingradius.com')) {
    const mockUsers: User[] = [
      {
        id: 'aman_rr',
        email: 'aman@rollingradius.com',
        name: 'Aman',
        role: 'load_agent',
        company: 'RollingRadius',
        companyLogo: '/rr_full_transp_old.png',
      },
      {
        id: 'deependra_darcl',
        email: 'deependra@cjdarcl.com',
        name: 'Deependra',
        role: 'load_agent',
        company: 'CJ Darcl Logistics',
        companyLogo: '/CJ-Darcl-01.png',
      },
    ];

    const updatedUsers = [...users, ...mockUsers];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  }
};

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
  updateUserRole: (role: User['role'], company?: string, companyLogo?: string) => {
    const user = auth.getCurrentUser();
    if (!user) return null;

    const updatedUser = { ...user, role, company, companyLogo };

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

  // Initialize mock users
  initializeMockUsers,
};
