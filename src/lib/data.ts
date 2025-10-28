// Data utilities using API

import { tripsAPI, walletsAPI, investmentsAPI, transactionsAPI, bankAccountsAPI, platformFeesAPI } from '../api';
import { toTitleCase } from './utils';

// Super Admin ID constant
const SUPER_ADMIN_ID = 'super_admin_001';

// Re-export types for backward compatibility
export interface Trip {
  id: string;
  loadOwnerId: string;
  loadOwnerName: string;
  loadOwnerLogo?: string;
  loadOwnerRating?: number;
  clientCompany?: string;
  clientLogo?: string;
  // Mandatory fields
  ewayBillNumber: string; // Required*
  ewayBillImage?: string; // Optional image
  pickup: string; // Required* (origin/pickup location)
  destination: string; // Required*
  sender: string; // Required* (consignee/sender)
  receiver: string; // Required* (receiver name)
  transporter: string; // Required* (transporter name)
  loanAmount: number; // Required* (loan amount in ₹)
  loanInterestRate: number; // Required* (interest rate %)
  maturityDays: number; // Required* (payment term in days)
  // Legacy/optional fields for backward compatibility
  transporterId?: string;
  transporterName?: string;
  origin: string; // Same as pickup, kept for backward compatibility
  distance: number;
  loadType: string;
  weight: number;
  amount: number; // Same as loanAmount, kept for backward compatibility
  interestRate?: number; // Same as loanInterestRate, kept for backward compatibility
  riskLevel?: 'low' | 'medium' | 'high';
  insuranceStatus?: boolean;
  status: 'pending' | 'escrowed' | 'funded' | 'in_transit' | 'completed' | 'cancelled' | 'repaid';
  createdAt: string;
  fundedAt?: string;
  completedAt?: string;
  repaidAt?: string;
  repaymentAmount?: number;
  repaymentPrincipal?: number;
  repaymentInterest?: number;
  repaymentDays?: number;
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

  if (obj !== null && obj.constructor === Object) {
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

  if (obj !== null && obj.constructor === Object) {
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
      // Re-throw the error so it can be caught and handled properly by the caller
      throw error;
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
      console.log('🔵 [CREATE TRANSACTION] Input (camelCase):', JSON.stringify(transaction, null, 2));
      const snakeCaseTransaction = toSnakeCase(transaction);
      console.log('🔵 [CREATE TRANSACTION] Converted (snake_case):', JSON.stringify(snakeCaseTransaction, null, 2));
      const newTransaction = await transactionsAPI.create(snakeCaseTransaction);
      return toCamelCase(newTransaction);
    } catch (error: any) {
      console.error('❌ [CREATE TRANSACTION] Error:', error);
      throw new Error(error.message || 'Failed to create transaction');
    }
  },

  // Allot trip to a lender
  allotTrip: async (tripId: string, lenderId: string, lenderName: string, currentUserId?: string): Promise<{ trip: Trip; investment: Investment } | null> => {
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
      console.log('Current user allotting:', currentUserId || trip.loadOwnerId);

      // Use the bid interest rate directly (no markup)
      // The lender's bid rate is final and will be used for the transporter

      // Update trip status to funded
      const updatedTrip = await data.updateTrip(tripId, {
        status: 'funded',
        lenderId: bid.lenderId,
        lenderName: bid.lenderName,
        interestRate: bid.interestRate,
        fundedAt: new Date().toISOString(),
      });

      if (!updatedTrip) {
        console.error('Failed to update trip status');
        return null;
      }

      console.log('Trip updated successfully, now processing funds transfer...');

      // Get investments for this trip and lender
      const investments = await investmentsAPI.getAll({ tripId, lenderId });
      console.log('Found investments:', investments.length);

      const investment = investments[0];

      // Always process fund transfers, regardless of investment record status
      // Transfer funds: lender escrow -> borrower balance

      // 1. Move lender's escrowed amount to total_invested
      console.log('🔵 [ALLOTMENT] Step 1: Moving lender escrow to invested...');
      try {
        await walletsAPI.invest(lenderId, bid.amount, tripId);
        console.log('✅ [ALLOTMENT] Lender escrow moved to invested successfully');
      } catch (investError) {
        console.error('❌ [ALLOTMENT] Failed to move lender escrow:', investError);
        // Continue anyway - borrower should still get funds
      }

      // 2. Create transaction for lender (escrow -> invested)
      console.log('🔵 [ALLOTMENT] Step 2: Creating lender transaction...');
      const lenderWallet = await data.getWallet(lenderId);
      try {
        await data.createTransaction({
          userId: lenderId,
          type: 'debit',
          amount: bid.amount,
          category: 'investment',
          description: `Invested ₹${bid.amount} in trip ${trip.origin} → ${trip.destination} (Borrower: ${toTitleCase(trip.loadOwnerName)})`,
          balanceAfter: lenderWallet.balance,
        });
        console.log('✅ [ALLOTMENT] Lender transaction created successfully');
      } catch (txnError) {
        console.error('❌ [ALLOTMENT] Failed to create lender transaction:', txnError);
        // Continue anyway - borrower should still get funds
      }

      // 3. Add amount to transporter/load agent's balance - THIS IS CRITICAL AND MUST ALWAYS HAPPEN
      // Use currentUserId (the user who clicked allot) if provided, otherwise fallback to trip owner
      const recipientUserId = currentUserId || trip.loadOwnerId;
          console.log('🔵 [ALLOTMENT] ========================================');
          console.log('🔵 [ALLOTMENT] Step 3: CREDITING TRANSPORTER/LOAD AGENT WALLET');
          console.log('🔵 [ALLOTMENT] ========================================');
          console.log('🔵 [ALLOTMENT] Recipient User ID (who gets the money):', recipientUserId);
          console.log('🔵 [ALLOTMENT] Original trip owner ID:', trip.loadOwnerId);
          console.log('🔵 [ALLOTMENT] Amount to credit:', bid.amount);

          if (!recipientUserId) {
            console.error('❌ [ALLOTMENT] CRITICAL: Recipient User ID is missing!');
            throw new Error('Recipient User ID is required to credit wallet');
          }

          // Get current wallet state
          let recipientWallet;
          try {
            recipientWallet = await data.getWallet(recipientUserId);
            console.log('🔵 [ALLOTMENT] Recipient wallet BEFORE update:', JSON.stringify({
              balance: recipientWallet.balance,
              lockedAmount: recipientWallet.lockedAmount,
              escrowedAmount: recipientWallet.escrowedAmount,
              totalInvested: recipientWallet.totalInvested,
              totalReturns: recipientWallet.totalReturns
            }, null, 2));
          } catch (walletError) {
            console.error('❌ [ALLOTMENT] Failed to get recipient wallet:', walletError);
            throw new Error(`Failed to fetch recipient wallet: ${(walletError as Error).message}`);
          }

          // Calculate transaction fee (0.5% of loan amount) and net amount
          const originalAmount = Number(bid.amount) || 0;
          const transactionFee = originalAmount * 0.005; // 0.5% fee
          const creditAmount = originalAmount - transactionFee; // Net amount after fee
          const oldBalance = Number(recipientWallet.balance) || 0;
          const newBalance = oldBalance + creditAmount;

          console.log('🔵 [ALLOTMENT] Balance calculation:');
          console.log('🔵 [ALLOTMENT]   Loan amount:', originalAmount);
          console.log('🔵 [ALLOTMENT]   Transaction fee (0.5%):', transactionFee);
          console.log('🔵 [ALLOTMENT]   Net credit amount:', creditAmount);
          console.log('🔵 [ALLOTMENT]   Old balance:', oldBalance);
          console.log('🔵 [ALLOTMENT]   New balance:', newBalance);

          // Update wallet - THIS IS CRITICAL!
          let updatedRecipientWallet;
          try {
            console.log('🔵 [ALLOTMENT] Calling walletsAPI.update() for recipient...');
            updatedRecipientWallet = await data.updateWallet(recipientUserId, {
              balance: newBalance
            });
            console.log('✅ [ALLOTMENT] Wallet update API call SUCCESS!');
            console.log('✅ [ALLOTMENT] Recipient wallet AFTER update:', JSON.stringify({
              balance: updatedRecipientWallet.balance,
              lockedAmount: updatedRecipientWallet.lockedAmount,
              escrowedAmount: updatedRecipientWallet.escrowedAmount,
              totalInvested: updatedRecipientWallet.totalInvested,
              totalReturns: updatedRecipientWallet.totalReturns
            }, null, 2));

            // Verify the balance was actually updated
            if (Number(updatedRecipientWallet.balance) !== newBalance) {
              console.error('❌ [ALLOTMENT] CRITICAL: Balance mismatch after update!');
              console.error('❌ [ALLOTMENT] Expected:', newBalance);
              console.error('❌ [ALLOTMENT] Got:', updatedRecipientWallet.balance);
              throw new Error('Wallet balance was not updated correctly');
            }
          } catch (updateError) {
            console.error('❌ [ALLOTMENT] FAILED to update recipient wallet!');
            console.error('❌ [ALLOTMENT] Error:', updateError);
            console.error('❌ [ALLOTMENT] Error message:', (updateError as Error).message);
            console.error('❌ [ALLOTMENT] Error stack:', (updateError as Error).stack);
            throw new Error(`Failed to credit recipient wallet: ${(updateError as Error).message}`);
          }

          // 4. Create transaction record for recipient - THIS IS ALSO CRITICAL!
          console.log('🔵 [ALLOTMENT] ========================================');
          console.log('🔵 [ALLOTMENT] Step 4: CREATING TRANSACTION RECORD');
          console.log('🔵 [ALLOTMENT] ========================================');

          try {
            // Create credit transaction for net amount received
            const transactionData = {
              userId: recipientUserId,
              type: 'credit' as const,
              amount: creditAmount,
              category: 'payment' as const,
              description: `Loan disbursed: ₹${originalAmount.toLocaleString('en-IN')} from ${toTitleCase(bid.lenderName)} for trip ${trip.origin} → ${trip.destination} (Net: ₹${creditAmount.toLocaleString('en-IN')} after 0.5% fee)`,
              balanceAfter: newBalance,
            };

            console.log('🔵 [ALLOTMENT] Transaction data:', JSON.stringify(transactionData, null, 2));
            console.log('🔵 [ALLOTMENT] Calling transactionsAPI.create()...');

            const transaction = await data.createTransaction(transactionData);

            // Create fee transaction record
            const feeTransactionData = {
              userId: recipientUserId,
              type: 'debit' as const,
              amount: transactionFee,
              category: 'fee' as const,
              description: `Transaction fee (0.5%) for loan from ${toTitleCase(bid.lenderName)}`,
              balanceAfter: newBalance,
            };

            await data.createTransaction(feeTransactionData);
            console.log('✅ [ALLOTMENT] Fee transaction created:', transactionFee);

            console.log('✅ [ALLOTMENT] Transaction created successfully!');
            console.log('✅ [ALLOTMENT] Transaction details:', JSON.stringify({
              id: transaction.id,
              userId: transaction.userId,
              type: transaction.type,
              amount: transaction.amount,
              category: transaction.category,
              description: transaction.description,
              balanceAfter: transaction.balanceAfter,
              timestamp: transaction.timestamp
            }, null, 2));
          } catch (txnError) {
            console.error('❌ [ALLOTMENT] FAILED to create transaction record!');
            console.error('❌ [ALLOTMENT] Error:', txnError);
            console.error('❌ [ALLOTMENT] Error message:', (txnError as Error).message);
            console.error('❌ [ALLOTMENT] Error stack:', (txnError as Error).stack);
            // DO NOT THROW - wallet is already updated, transaction is just for record-keeping
            // But log it very prominently
            console.error('⚠️  [ALLOTMENT] WARNING: Wallet was credited but transaction record failed to create!');
            console.error('⚠️  [ALLOTMENT] This means the money is in the wallet but not in transaction history!');
          }

          console.log('✅ [ALLOTMENT] ========================================');
          console.log('✅ [ALLOTMENT] RECIPIENT WALLET CREDITED SUCCESSFULLY!');
          console.log('✅ [ALLOTMENT] Recipient User ID:', recipientUserId);
          console.log('✅ [ALLOTMENT] Old balance:', oldBalance);
          console.log('✅ [ALLOTMENT] Loan amount:', originalAmount);
          console.log('✅ [ALLOTMENT] Transaction fee (0.5%):', transactionFee);
          console.log('✅ [ALLOTMENT] Net amount credited:', creditAmount);
          console.log('✅ [ALLOTMENT] New balance:', newBalance);
          console.log('✅ [ALLOTMENT] ========================================');

          // 5. Credit transaction fee to Super Admin wallet
          console.log('🔵 [ALLOTMENT] ========================================');
          console.log('🔵 [ALLOTMENT] Step 5: CREDITING FEE TO SUPER ADMIN');
          console.log('🔵 [ALLOTMENT] ========================================');
          console.log('🔵 [ALLOTMENT] Super Admin ID:', SUPER_ADMIN_ID);
          console.log('🔵 [ALLOTMENT] Fee amount to credit:', transactionFee);

          let superAdminTransactionId: string | undefined;
          try {
            // Get super admin wallet
            const superAdminWallet = await data.getWallet(SUPER_ADMIN_ID);
            const superAdminOldBalance = Number(superAdminWallet.balance) || 0;
            const superAdminNewBalance = superAdminOldBalance + transactionFee;

            console.log('🔵 [ALLOTMENT] Super Admin wallet balance before:', superAdminOldBalance);
            console.log('🔵 [ALLOTMENT] Super Admin wallet balance after:', superAdminNewBalance);

            // Update super admin wallet
            await data.updateWallet(SUPER_ADMIN_ID, {
              balance: superAdminNewBalance
            });

            console.log('✅ [ALLOTMENT] Super Admin wallet updated successfully');

            // Create transaction record for super admin receiving fee
            const superAdminTransaction = await data.createTransaction({
              userId: SUPER_ADMIN_ID,
              type: 'credit' as const,
              amount: transactionFee,
              category: 'fee' as const,
              description: `Platform fee (0.5%) from loan: ${toTitleCase(bid.lenderName)} → ${toTitleCase(trip.loadOwnerName)} (Trip: ${trip.origin} → ${trip.destination})`,
              balanceAfter: superAdminNewBalance,
            });

            superAdminTransactionId = superAdminTransaction.id;
            console.log('✅ [ALLOTMENT] Super Admin fee transaction created:', superAdminTransactionId);

            // 6. Create platform fee record
            console.log('🔵 [ALLOTMENT] ========================================');
            console.log('🔵 [ALLOTMENT] Step 6: CREATING PLATFORM FEE RECORD');
            console.log('🔵 [ALLOTMENT] ========================================');

            await platformFeesAPI.create({
              trip_id: tripId,
              lender_id: bid.lenderId,
              lender_name: bid.lenderName,
              borrower_id: recipientUserId,
              borrower_name: trip.loadOwnerName,
              loan_amount: originalAmount,
              fee_percentage: 0.5,
              fee_amount: transactionFee,
              super_admin_transaction_id: superAdminTransactionId,
              borrower_transaction_id: transaction.id,
            });

            console.log('✅ [ALLOTMENT] Platform fee record created successfully');
            console.log('✅ [ALLOTMENT] ========================================');
            console.log('✅ [ALLOTMENT] FEE CREDITED TO SUPER ADMIN SUCCESSFULLY!');
            console.log('✅ [ALLOTMENT] ========================================');
          } catch (superAdminError) {
            console.error('❌ [ALLOTMENT] Failed to credit fee to super admin!');
            console.error('❌ [ALLOTMENT] Error:', superAdminError);
            console.error('❌ [ALLOTMENT] This is not critical - borrower funds are safe');
            // Don't throw - the main transaction (borrower getting funds) is complete
          }

      // 8. Update investment status (do this last, it's less critical than wallet transfers)
      console.log('🔵 [ALLOTMENT] ========================================');
      console.log('🔵 [ALLOTMENT] Step 8: Updating investment status');
      console.log('🔵 [ALLOTMENT] ========================================');

      let updatedInvestment = null;
      if (investment) {
        try {
          console.log('🔵 [ALLOTMENT] Updating investment status to active:', investment.id);
          updatedInvestment = await investmentsAPI.updateStatus(investment.id, 'active');
          console.log('✅ [ALLOTMENT] Investment updated successfully');
        } catch (investmentError) {
          console.error('❌ [ALLOTMENT] Failed to update investment status:', investmentError);
          // Don't fail the whole operation - wallet transfers are already done
        }
      } else {
        console.warn('⚠️  [ALLOTMENT] No investment record found for trip:', tripId, 'lender:', lenderId);
        console.warn('⚠️  [ALLOTMENT] Wallet transfers completed successfully despite missing investment record');
      }

      console.log('✅ [ALLOTMENT] ========================================');
      console.log('✅ [ALLOTMENT] TRIP ALLOTMENT COMPLETED SUCCESSFULLY!');
      console.log('✅ [ALLOTMENT] ========================================');

      return { trip: updatedTrip, investment: updatedInvestment ? toCamelCase(updatedInvestment) : null };
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
