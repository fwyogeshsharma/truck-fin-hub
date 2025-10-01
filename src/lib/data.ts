// Static data and mock data utilities

export interface Trip {
  id: string;
  loadOwnerId: string;
  loadOwnerName: string;
  transporterId?: string;
  transporterName?: string;
  origin: string;
  destination: string;
  distance: number;
  loadType: string;
  weight: number;
  amount: number;
  requestedAmount: number;
  interestRate?: number;
  status: 'pending' | 'funded' | 'in_transit' | 'completed' | 'cancelled';
  createdAt: string;
  fundedAt?: string;
  completedAt?: string;
  lenderId?: string;
  lenderName?: string;
}

export interface Investment {
  id: string;
  lenderId: string;
  tripId: string;
  amount: number;
  interestRate: number;
  expectedReturn: number;
  status: 'active' | 'completed' | 'defaulted';
  investedAt: string;
  maturityDate: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  category: 'investment' | 'return' | 'payment' | 'refund' | 'fee';
  description: string;
  timestamp: string;
  balanceAfter: number;
}

export interface Wallet {
  userId: string;
  balance: number;
  lockedAmount: number;
  totalInvested: number;
  totalReturns: number;
}

const TRIPS_KEY = 'logistics_trips';
const INVESTMENTS_KEY = 'logistics_investments';
const TRANSACTIONS_KEY = 'logistics_transactions';
const WALLETS_KEY = 'logistics_wallets';

// Initialize with mock data if empty
const initializeMockData = () => {
  if (!localStorage.getItem(TRIPS_KEY)) {
    const mockTrips: Trip[] = [
      {
        id: '1',
        loadOwnerId: 'lo1',
        loadOwnerName: 'ABC Logistics Pvt Ltd',
        origin: 'Mumbai, Maharashtra',
        destination: 'Delhi, NCR',
        distance: 1400,
        loadType: 'Electronics',
        weight: 15000,
        amount: 350000,
        requestedAmount: 280000,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        loadOwnerId: 'lo2',
        loadOwnerName: 'Prime Transport Co',
        origin: 'Bangalore, Karnataka',
        destination: 'Hyderabad, Telangana',
        distance: 570,
        loadType: 'Textiles',
        weight: 12000,
        amount: 180000,
        requestedAmount: 150000,
        interestRate: 12,
        status: 'funded',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fundedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        lenderId: 'l1',
        lenderName: 'HDFC Bank',
        transporterId: 't1',
        transporterName: 'Fast Move Transporters',
      },
      {
        id: '3',
        loadOwnerId: 'lo3',
        loadOwnerName: 'Eastern Cargo Services',
        origin: 'Kolkata, West Bengal',
        destination: 'Chennai, Tamil Nadu',
        distance: 1670,
        loadType: 'Machinery Parts',
        weight: 20000,
        amount: 450000,
        requestedAmount: 360000,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    localStorage.setItem(TRIPS_KEY, JSON.stringify(mockTrips));
  }
};

export const data = {
  // Trips
  getTrips: (): Trip[] => {
    initializeMockData();
    const tripsData = localStorage.getItem(TRIPS_KEY);
    return tripsData ? JSON.parse(tripsData) : [];
  },

  getTrip: (id: string): Trip | undefined => {
    return data.getTrips().find(t => t.id === id);
  },

  createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'status'>): Trip => {
    const trips = data.getTrips();
    const newTrip: Trip = {
      ...trip,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    trips.push(newTrip);
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    return newTrip;
  },

  updateTrip: (id: string, updates: Partial<Trip>): Trip | null => {
    const trips = data.getTrips();
    const index = trips.findIndex(t => t.id === id);
    if (index === -1) return null;

    trips[index] = { ...trips[index], ...updates };
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    return trips[index];
  },

  // Investments
  getInvestments: (): Investment[] => {
    const investmentsData = localStorage.getItem(INVESTMENTS_KEY);
    return investmentsData ? JSON.parse(investmentsData) : [];
  },

  createInvestment: (investment: Omit<Investment, 'id' | 'investedAt'>): Investment => {
    const investments = data.getInvestments();
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
      investedAt: new Date().toISOString(),
    };
    investments.push(newInvestment);
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
    return newInvestment;
  },

  // Wallets
  getWallet: (userId: string): Wallet => {
    const walletsData = localStorage.getItem(WALLETS_KEY);
    const wallets: Wallet[] = walletsData ? JSON.parse(walletsData) : [];
    const wallet = wallets.find(w => w.userId === userId);
    
    if (wallet) return wallet;

    // Create default wallet
    const newWallet: Wallet = {
      userId,
      balance: 1000000, // Default balance for demo
      lockedAmount: 0,
      totalInvested: 0,
      totalReturns: 0,
    };
    wallets.push(newWallet);
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    return newWallet;
  },

  updateWallet: (userId: string, updates: Partial<Wallet>): Wallet => {
    const walletsData = localStorage.getItem(WALLETS_KEY);
    const wallets: Wallet[] = walletsData ? JSON.parse(walletsData) : [];
    const index = wallets.findIndex(w => w.userId === userId);

    if (index !== -1) {
      wallets[index] = { ...wallets[index], ...updates };
    } else {
      wallets.push({ userId, balance: 0, lockedAmount: 0, totalInvested: 0, totalReturns: 0, ...updates });
    }

    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    return wallets[index !== -1 ? index : wallets.length - 1];
  },

  // Transactions
  getTransactions: (userId: string): Transaction[] => {
    const transactionsData = localStorage.getItem(TRANSACTIONS_KEY);
    const allTransactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];
    return allTransactions.filter(t => t.userId === userId);
  },

  createTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction => {
    const transactionsData = localStorage.getItem(TRANSACTIONS_KEY);
    const transactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];
    
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    transactions.push(newTransaction);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    return newTransaction;
  },
};
