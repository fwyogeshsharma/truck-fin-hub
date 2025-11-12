// Data utilities using API

import { tripsAPI, walletsAPI, investmentsAPI, transactionsAPI, bankAccountsAPI } from '../api';

// Re-export types for backward compatibility
export interface Trip {
  id: string;
  loadOwnerId: string;
  loadOwnerName: string;
  loadOwnerLogo?: string;
  loadOwnerRating?: number;
  clientCompany?: string;
  clientLogo?: string;
  transporterId?: string;
  transporterName?: string;
  origin: string;
  destination: string;
  distance: number;
  loadType: string;
  weight: number;
  amount: number;
  interestRate?: number;
  maturityDays?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  insuranceStatus?: boolean;
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
    bilty?: string;
    ewaybill?: string;
    advance_invoice?: string;
    pod?: string;
    final_invoice?: string;
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
  category: 'investment' | 'return' | 'payment' | 'refund' | 'fee' | 'withdrawal';
  description: string;
  timestamp: string;
  balanceAfter: number;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: 'savings' | 'current';
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  lockedAmount: number;
  escrowedAmount: number;
  totalInvested: number;
  totalReturns: number;
}

// Helper function to convert snake_case API response to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }

  return obj;
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }

  return obj;
};

export const data = {
  // Trips
  getTrips: async (): Promise<Trip[]> => {
    try {
      const trips = await tripsAPI.getAll();
      return toCamelCase(trips);
    } catch (error) {
      console.error('Failed to get trips:', error);
      return [];
    }
  },

  getTrip: async (id: string): Promise<Trip | undefined> => {
    try {
      const trip = await tripsAPI.getById(id);
      return toCamelCase(trip);
    } catch (error) {
      console.error('Failed to get trip:', error);
      return undefined;
    }
  },

  createTrip: async (trip: Omit<Trip, 'id' | 'createdAt' | 'status'>): Promise<Trip> => {
    try {
      const snakeCaseTrip = toSnakeCase(trip);
      const newTrip = await tripsAPI.create(snakeCaseTrip);
      return toCamelCase(newTrip);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create trip');
    }
  },

  updateTrip: async (id: string, updates: Partial<Trip>): Promise<Trip | null> => {
    try {
      const snakeCaseUpdates = toSnakeCase(updates);
      const updatedTrip = await tripsAPI.update(id, snakeCaseUpdates);
      return toCamelCase(updatedTrip);
    } catch (error) {
      console.error('Failed to update trip:', error);
      return null;
    }
  },

  addBid: async (tripId: string, lenderId: string, lenderName: string, amount: number, interestRate: number): Promise<any> => {
    try {
      const bid = await tripsAPI.addBid(tripId, {
        lenderId,
        lenderName,
        amount,
        interestRate,
      });
      return toCamelCase(bid);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add bid');
    }
  },

  // Investments
  getInvestments: async (): Promise<Investment[]> => {
    try {
      const investments = await investmentsAPI.getAll();
      return toCamelCase(investments);
    } catch (error) {
      console.error('Failed to get investments:', error);
      return [];
    }
  },

  createInvestment: async (investment: Omit<Investment, 'id' | 'investedAt'>): Promise<Investment> => {
    try {
      const snakeCaseInvestment = toSnakeCase(investment);
      const newInvestment = await investmentsAPI.create(snakeCaseInvestment);
      return toCamelCase(newInvestment);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create investment');
    }
  },

  updateInvestment: async (id: string, updates: Partial<Investment>): Promise<Investment | null> => {
    try {
      const snakeCaseUpdates = toSnakeCase(updates);
      const updatedInvestment = await investmentsAPI.update(id, snakeCaseUpdates);
      return toCamelCase(updatedInvestment);
    } catch (error) {
      console.error('Failed to update investment:', error);
      return null;
    }
  },

  // Wallets
  getWallet: async (userId: string): Promise<Wallet> => {
    try {
      const wallet = await walletsAPI.get(userId);
      return toCamelCase(wallet);
    } catch (error) {
      console.error('Failed to get wallet:', error);
      // Return default wallet on error
      return {
        userId,
        balance: 0,
        lockedAmount: 0,
        escrowedAmount: 0,
        totalInvested: 0,
        totalReturns: 0,
      };
    }
  },

  updateWallet: async (userId: string, updates: Partial<Wallet>): Promise<Wallet> => {
    try {
      const snakeCaseUpdates = toSnakeCase(updates);
      const updatedWallet = await walletsAPI.update(userId, snakeCaseUpdates);
      return toCamelCase(updatedWallet);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update wallet');
    }
  },

  // Transactions
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    try {
      const transactions = await transactionsAPI.getAll({ userId });
      return toCamelCase(transactions);
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  },

  createTransaction: async (transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> => {
    try {
      const snakeCaseTransaction = toSnakeCase(transaction);
      const newTransaction = await transactionsAPI.create(snakeCaseTransaction);
      return toCamelCase(newTransaction);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create transaction');
    }
  },

  // Allot trip to a lender
  allotTrip: async (tripId: string, lenderId: string, lenderName: string): Promise<{ trip: Trip; investment: Investment } | null> => {
    try {
      const trip = await data.getTrip(tripId);
      if (!trip || !trip.bids || trip.bids.length === 0) {
        console.error('Trip not found or has no bids:', tripId);
        return null;
      }

      const bid = trip.bids.find(b => b.lenderId === lenderId);
      if (!bid) {
        console.error('Bid not found for lender:', lenderId);
        return null;
      }

      console.log('Allotting trip:', tripId, 'to lender:', lenderId);

      // Calculate adjusted interest rate for shipper (lender rate + 20% markup)
      const maturityDays = trip.maturityDays || 30;
      const yearlyRate = (bid.interestRate * 365) / maturityDays;
      const adjustedYearlyRate = yearlyRate * 1.2;
      const shipperRate = (adjustedYearlyRate * maturityDays) / 365;

      // Update trip status to funded
      const updatedTrip = await data.updateTrip(tripId, {
        status: 'funded',
        lenderId: bid.lenderId,
        lenderName: bid.lenderName,
        interestRate: shipperRate,
        fundedAt: new Date().toISOString(),
      });

      if (!updatedTrip) {
        console.error('Failed to update trip status');
        return null;
      }

      console.log('Trip updated successfully, now updating investment...');

      // Get investments for this trip and lender
      const investments = await investmentsAPI.getAll({ tripId, lenderId });
      console.log('Found investments:', investments.length);

      const investment = investments[0];

      if (investment) {
        console.log('Updating investment status to active:', investment.id);
        const updatedInvestment = await investmentsAPI.updateStatus(investment.id, 'active');

        if (updatedInvestment) {
          console.log('Investment updated successfully');

          // Transfer funds: lender escrow -> borrower balance
          // 1. Move lender's escrowed amount to total_invested
          await walletsAPI.invest(lenderId, bid.amount, tripId);

          // 2. Create transaction for lender (escrow -> invested)
          const lenderWallet = await data.getWallet(lenderId);
          console.log('Creating lender transaction...');
          try {
            await data.createTransaction({
              userId: lenderId,
              type: 'debit',
              amount: bid.amount,
              category: 'investment',
              description: `Invested ₹${bid.amount} in trip ${trip.origin} → ${trip.destination} (Borrower: ${trip.loadOwnerName})`,
              balanceAfter: lenderWallet.balance,
            });
            console.log('Lender transaction created successfully');
          } catch (txnError) {
            console.error('Failed to create lender transaction:', txnError);
          }

          // 3. Add amount to borrower's balance
          const borrowerId = trip.loadOwnerId;
          console.log('Borrower ID:', borrowerId);
          const borrowerWallet = await data.getWallet(borrowerId);
          console.log('Borrower wallet before update:', borrowerWallet);

          const newBalance = borrowerWallet.balance + bid.amount;
          const updatedBorrowerWallet = await data.updateWallet(borrowerId, {
            balance: newBalance
          });
          console.log('Borrower wallet after update:', updatedBorrowerWallet);

          // 4. Create transaction for borrower (received funding)
          console.log('Creating transaction for borrower...');
          try {
            const transaction = await data.createTransaction({
              userId: borrowerId,
              type: 'credit',
              amount: bid.amount,
              category: 'payment',
              description: `Received ₹${bid.amount} from ${bid.lenderName} for trip ${trip.origin} → ${trip.destination}`,
              balanceAfter: newBalance,
            });
            console.log('Borrower transaction created:', transaction);
          } catch (txnError) {
            console.error('Failed to create borrower transaction:', txnError);
          }

          return { trip: updatedTrip, investment: toCamelCase(updatedInvestment) };
        } else {
          console.error('Failed to update investment status');
        }
      } else {
        console.error('No investment found for trip:', tripId, 'lender:', lenderId);
      }

      return null;
    } catch (error) {
      console.error('Failed to allot trip:', error);
      return null;
    }
  },

  // Bank Account operations
  getBankAccounts: async (userId: string): Promise<BankAccount[]> => {
    try {
      const accounts = await bankAccountsAPI.getByUser(userId);
      return toCamelCase(accounts);
    } catch (error) {
      console.error('Failed to get bank accounts:', error);
      return [];
    }
  },

  getPrimaryBankAccount: async (userId: string): Promise<BankAccount | null> => {
    try {
      const account = await bankAccountsAPI.getPrimary(userId);
      return toCamelCase(account);
    } catch (error) {
      console.error('Failed to get primary bank account:', error);
      return null;
    }
  },

  createBankAccount: async (accountData: Omit<BankAccount, 'id' | 'createdAt' | 'isVerified'>): Promise<BankAccount> => {
    try {
      const snakeCaseData = toSnakeCase(accountData);
      const newAccount = await bankAccountsAPI.create(snakeCaseData);
      return toCamelCase(newAccount);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create bank account');
    }
  },

  updateBankAccount: async (accountId: string, updates: Partial<BankAccount>): Promise<BankAccount | null> => {
    try {
      const snakeCaseUpdates = toSnakeCase(updates);
      const updatedAccount = await bankAccountsAPI.update(accountId, snakeCaseUpdates);
      return toCamelCase(updatedAccount);
    } catch (error) {
      console.error('Failed to update bank account:', error);
      return null;
    }
  },

  deleteBankAccount: async (accountId: string): Promise<boolean> => {
    try {
      await bankAccountsAPI.delete(accountId);
      return true;
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      return false;
    }
  },

  setPrimaryBankAccount: async (userId: string, accountId: string): Promise<boolean> => {
    try {
      await bankAccountsAPI.setPrimary(accountId);
      return true;
    } catch (error) {
      console.error('Failed to set primary bank account:', error);
      return false;
    }
  },
};
