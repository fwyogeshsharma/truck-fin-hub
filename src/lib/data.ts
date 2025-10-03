// Static data and mock data utilities

export interface Trip {
  id: string;
  loadOwnerId: string;
  loadOwnerName: string;
  loadOwnerLogo?: string;
  loadOwnerRating?: number; // Rating out of 5
  clientCompany?: string; // Client company name
  clientLogo?: string; // Client company logo
  transporterId?: string;
  transporterName?: string;
  origin: string;
  destination: string;
  distance: number;
  loadType: string;
  weight: number;
  amount: number; // Trip value (20K-30K range)
  interestRate?: number;
  maturityDays?: number;
  riskLevel?: 'low' | 'medium' | 'high'; // AI-based risk assessment
  insuranceStatus?: boolean; // Y/N if trip is insured
  status: 'pending' | 'escrowed' | 'funded' | 'in_transit' | 'completed' | 'cancelled';
  createdAt: string;
  fundedAt?: string;
  completedAt?: string;
  lenderId?: string;
  lenderName?: string;
  bids?: Array<{
    lenderId: string;
    lenderName: string;
    amount: number;
    interestRate: number;
  }>;
  documents?: {
    bilty?: string; // Base64 or file path
    ewaybill?: string;
    invoice?: string;
  };
}

export interface Investment {
  id: string;
  lenderId: string;
  tripId: string;
  amount: number;
  interestRate: number;
  expectedReturn: number;
  status: 'escrowed' | 'active' | 'completed' | 'defaulted';
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
  escrowedAmount: number;
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
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Emami Ltd',
        clientLogo: '/clients/emami.png',
        origin: 'Mumbai, Maharashtra',
        destination: 'Delhi, NCR',
        distance: 1400,
        loadType: 'FMCG Products',
        weight: 15000,
        amount: 28000,
        maturityDays: 45,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Berger Paints',
        clientLogo: '/clients/berger.png',
        origin: 'Bangalore, Karnataka',
        destination: 'Hyderabad, Telangana',
        distance: 570,
        loadType: 'Paint Products',
        weight: 12000,
        amount: 22000,
        maturityDays: 60,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Greenply Industries',
        clientLogo: '/clients/greenply.png',
        origin: 'Kolkata, West Bengal',
        destination: 'Chennai, Tamil Nadu',
        distance: 1670,
        loadType: 'Plywood & Laminates',
        weight: 20000,
        amount: 29000,
        maturityDays: 90,
        riskLevel: 'medium',
        insuranceStatus: false,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Varun Beverages',
        clientLogo: '/clients/Varun-Beverages.png',
        origin: 'Gurugram, Haryana',
        destination: 'Lucknow, Uttar Pradesh',
        distance: 550,
        loadType: 'Beverages',
        weight: 18000,
        amount: 25000,
        maturityDays: 30,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Balaji Wafers',
        clientLogo: '/clients/balaji.png',
        origin: 'Ahmedabad, Gujarat',
        destination: 'Pune, Maharashtra',
        distance: 660,
        loadType: 'Snacks & Food Items',
        weight: 10000,
        amount: 23000,
        maturityDays: 75,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '6',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Oswal Cables',
        clientLogo: '/clients/oswal-cables.png',
        origin: 'Ludhiana, Punjab',
        destination: 'Jaipur, Rajasthan',
        distance: 520,
        loadType: 'Electrical Cables',
        weight: 14000,
        amount: 27000,
        maturityDays: 50,
        riskLevel: 'medium',
        insuranceStatus: false,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '7',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Dynamic Cables',
        clientLogo: '/clients/dynamic-cables.png',
        origin: 'Noida, Uttar Pradesh',
        destination: 'Bhopal, Madhya Pradesh',
        distance: 690,
        loadType: 'Wire & Cables',
        weight: 13000,
        amount: 24000,
        maturityDays: 65,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '8',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Rex Pipes & Cables',
        clientLogo: '/clients/rex-pipes.png',
        origin: 'Vadodara, Gujarat',
        destination: 'Indore, Madhya Pradesh',
        distance: 440,
        loadType: 'PVC Pipes',
        weight: 16000,
        amount: 26000,
        maturityDays: 40,
        riskLevel: 'medium',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '9',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Bhandari Plastic Industries',
        clientLogo: '/clients/bhandari-plastic.png',
        origin: 'Rajkot, Gujarat',
        destination: 'Nagpur, Maharashtra',
        distance: 980,
        loadType: 'Plastic Products',
        weight: 11000,
        amount: 21000,
        maturityDays: 55,
        riskLevel: 'low',
        insuranceStatus: false,
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '10',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Mohit Polytech Pvt Ltd',
        clientLogo: '/clients/Mohit-Polytech-Pvt-Ltd.png',
        origin: 'Kanpur, Uttar Pradesh',
        destination: 'Patna, Bihar',
        distance: 510,
        loadType: 'Polymer Products',
        weight: 12500,
        amount: 24500,
        maturityDays: 70,
        riskLevel: 'medium',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '11',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'True Power Solar',
        clientLogo: '/clients/true-power.png',
        origin: 'Coimbatore, Tamil Nadu',
        destination: 'Kochi, Kerala',
        distance: 230,
        loadType: 'Solar Panels',
        weight: 9000,
        amount: 20000,
        maturityDays: 35,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '12',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'INA Energy Solutions',
        clientLogo: '/clients/ina-energy.png',
        origin: 'Surat, Gujarat',
        destination: 'Mumbai, Maharashtra',
        distance: 280,
        loadType: 'Energy Equipment',
        weight: 15000,
        amount: 27500,
        maturityDays: 80,
        riskLevel: 'medium',
        insuranceStatus: false,
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '13',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Mangal Electricals',
        clientLogo: '/clients/mangal-electricals.png',
        origin: 'Amritsar, Punjab',
        destination: 'Chandigarh, Punjab',
        distance: 240,
        loadType: 'Electrical Goods',
        weight: 8000,
        amount: 20500,
        maturityDays: 42,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '14',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Manishankar Oils',
        clientLogo: '/clients/Manishankar-Oils.png',
        origin: 'Indore, Madhya Pradesh',
        destination: 'Nagpur, Maharashtra',
        distance: 370,
        loadType: 'Edible Oils',
        weight: 17000,
        amount: 28500,
        maturityDays: 58,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '15',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Source One Distributors',
        clientLogo: '/clients/source-one.png',
        origin: 'Nashik, Maharashtra',
        destination: 'Aurangabad, Maharashtra',
        distance: 180,
        loadType: 'Consumer Goods',
        weight: 10500,
        amount: 22500,
        maturityDays: 48,
        riskLevel: 'low',
        insuranceStatus: false,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '16',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Star Rising Enterprises',
        clientLogo: '/clients/star-rising.png',
        origin: 'Visakhapatnam, Andhra Pradesh',
        destination: 'Vijayawada, Andhra Pradesh',
        distance: 350,
        loadType: 'Industrial Materials',
        weight: 19000,
        amount: 29500,
        maturityDays: 85,
        riskLevel: 'medium',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '17',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'RCC Cement',
        clientLogo: '/clients/rcc.png',
        origin: 'Raipur, Chhattisgarh',
        destination: 'Ranchi, Jharkhand',
        distance: 420,
        loadType: 'Cement',
        weight: 22000,
        amount: 30000,
        maturityDays: 62,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '18',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'Sagar Cements',
        clientLogo: '/clients/sagar.png',
        origin: 'Hyderabad, Telangana',
        destination: 'Bangalore, Karnataka',
        distance: 570,
        loadType: 'Cement & Construction Materials',
        weight: 24000,
        amount: 29800,
        maturityDays: 78,
        riskLevel: 'medium',
        insuranceStatus: false,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '19',
        loadOwnerId: 'rr',
        loadOwnerName: 'RollingRadius',
        loadOwnerLogo: '/rr_full_transp_old.png',
        loadOwnerRating: 4.8,
        clientCompany: 'Raydean Industries',
        clientLogo: '/clients/raydean.png',
        origin: 'Jamshedpur, Jharkhand',
        destination: 'Durgapur, West Bengal',
        distance: 290,
        loadType: 'Steel Products',
        weight: 21000,
        amount: 28800,
        maturityDays: 52,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '20',
        loadOwnerId: 'darcl',
        loadOwnerName: 'CJ Darcl Logistics',
        loadOwnerLogo: '/CJ-Darcl-01.png',
        loadOwnerRating: 4.7,
        clientCompany: 'RL Industries',
        clientLogo: '/clients/rl-industries.png',
        origin: 'Faridabad, Haryana',
        destination: 'Meerut, Uttar Pradesh',
        distance: 180,
        loadType: 'Industrial Equipment',
        weight: 16500,
        amount: 26000,
        maturityDays: 68,
        riskLevel: 'low',
        insuranceStatus: true,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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

  updateInvestment: (id: string, updates: Partial<Investment>): Investment | null => {
    const investments = data.getInvestments();
    const index = investments.findIndex(i => i.id === id);
    if (index === -1) return null;

    investments[index] = { ...investments[index], ...updates };
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
    return investments[index];
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
      balance: 5000000, // Default balance for demo
      lockedAmount: 0,
      escrowedAmount: 0,
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
      wallets.push({ userId, balance: 0, lockedAmount: 0, escrowedAmount: 0, totalInvested: 0, totalReturns: 0, ...updates });
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

  // Allot trip to a lender
  allotTrip: (tripId: string, lenderId: string, lenderName: string): { trip: Trip; investment: Investment } | null => {
    const trip = data.getTrip(tripId);
    if (!trip || !trip.bids || trip.bids.length === 0) return null;

    const bid = trip.bids.find(b => b.lenderId === lenderId);
    if (!bid) return null;

    // Update trip status to funded
    const updatedTrip = data.updateTrip(tripId, {
      status: 'funded',
      lenderId: bid.lenderId,
      lenderName: bid.lenderName,
      interestRate: bid.interestRate,
      fundedAt: new Date().toISOString(),
    });

    if (!updatedTrip) return null;

    // Update investment status to active
    const investments = data.getInvestments();
    const investment = investments.find(i => i.tripId === tripId && i.lenderId === lenderId);

    if (investment) {
      const updatedInvestment = data.updateInvestment(investment.id, {
        status: 'active',
      });

      if (updatedInvestment) {
        // Move funds from escrowed to invested
        const wallet = data.getWallet(lenderId);
        data.updateWallet(lenderId, {
          escrowedAmount: wallet.escrowedAmount - bid.amount,
          totalInvested: wallet.totalInvested + bid.amount,
        });

        return { trip: updatedTrip, investment: updatedInvestment };
      }
    }

    return null;
  },
};
