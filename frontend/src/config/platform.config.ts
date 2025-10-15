/**
 * Platform Configuration
 *
 * This file stores all configurable platform settings including fees, rates, and limits.
 * Only Super Admin can modify these settings through the admin portal.
 */

export interface PlatformConfig {
  // Platform Fees (in percentage)
  fees: {
    platformFee: number; // Platform service fee percentage
    transactionFee: number; // Transaction processing fee percentage
    loadAgentCommission: number; // Commission for load agents percentage
    vehicleAgentCommission: number; // Commission for vehicle agents percentage
    earlyPaymentDiscount: number; // Early payment discount percentage
  };

  // Interest Rate Limits
  interestRates: {
    minRate: number; // Minimum interest rate allowed
    maxRate: number; // Maximum interest rate allowed
    defaultRate: number; // Default recommended rate
  };

  // Investment Limits (in rupees)
  investmentLimits: {
    minInvestment: number; // Minimum investment amount per trip
    maxInvestment: number; // Maximum investment amount per trip
    minTripValue: number; // Minimum trip value to list
    maxTripValue: number; // Maximum trip value allowed
  };

  // Wallet and Transaction Settings
  wallet: {
    minTopUp: number; // Minimum wallet top-up amount
    maxTopUp: number; // Maximum wallet top-up amount
    minWithdrawal: number; // Minimum withdrawal amount
    maxWithdrawal: number; // Maximum withdrawal amount per transaction
    dailyWithdrawalLimit: number; // Maximum withdrawal per day
  };

  // Maturity and Payment Terms
  terms: {
    defaultMaturityDays: number; // Default maturity period in days
    minMaturityDays: number; // Minimum maturity period
    maxMaturityDays: number; // Maximum maturity period
    gracePeriodDays: number; // Grace period before default
    penaltyRate: number; // Late payment penalty rate percentage
  };

  // KYC and Verification
  kyc: {
    requiredForAmount: number; // KYC required above this amount
    documentExpiryDays: number; // Days before document re-verification
    maxPendingInvestments: number; // Max investments without KYC
  };

  // Risk Assessment
  risk: {
    lowRiskMaxLTV: number; // Max LTV for low risk trips
    mediumRiskMaxLTV: number; // Max LTV for medium risk trips
    highRiskMaxLTV: number; // Max LTV for high risk trips
    insuranceMultiplier: number; // LTV increase if insured
  };
}

// Default platform configuration
export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  fees: {
    platformFee: 2.5, // 2.5% platform fee
    transactionFee: 1.0, // 1% transaction fee
    loadAgentCommission: 1.5, // 1.5% commission
    vehicleAgentCommission: 1.0, // 1% commission
    earlyPaymentDiscount: 0.5, // 0.5% discount for early payment
  },

  interestRates: {
    minRate: 8.0, // 8% minimum
    maxRate: 18.0, // 18% maximum
    defaultRate: 12.0, // 12% default
  },

  investmentLimits: {
    minInvestment: 10000, // ₹10,000 minimum
    maxInvestment: 10000000, // ₹1 crore maximum
    minTripValue: 5000, // ₹5,000 minimum trip value
    maxTripValue: 50000000, // ₹5 crore maximum trip value
  },

  wallet: {
    minTopUp: 1000, // ₹1,000 minimum top-up
    maxTopUp: 10000000, // ₹1 crore maximum top-up
    minWithdrawal: 500, // ₹500 minimum withdrawal
    maxWithdrawal: 1000000, // ₹10 lakh max per transaction
    dailyWithdrawalLimit: 5000000, // ₹50 lakh daily limit
  },

  terms: {
    defaultMaturityDays: 30, // 30 days default
    minMaturityDays: 7, // 7 days minimum
    maxMaturityDays: 365, // 365 days maximum (1 year)
    gracePeriodDays: 7, // 7 days grace period
    penaltyRate: 2.0, // 2% penalty per month
  },

  kyc: {
    requiredForAmount: 50000, // KYC required above ₹50,000
    documentExpiryDays: 365, // Re-verify annually
    maxPendingInvestments: 3, // Max 3 investments without KYC
  },

  risk: {
    lowRiskMaxLTV: 75, // 75% LTV for low risk
    mediumRiskMaxLTV: 60, // 60% LTV for medium risk
    highRiskMaxLTV: 50, // 50% LTV for high risk
    insuranceMultiplier: 1.2, // 20% increase if insured
  },
};

// Helper function to get platform config (from localStorage or default)
export const getPlatformConfig = (): PlatformConfig => {
  const stored = localStorage.getItem('platform_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse platform config:', e);
    }
  }
  return DEFAULT_PLATFORM_CONFIG;
};

// Helper function to save platform config
export const savePlatformConfig = (config: PlatformConfig): void => {
  localStorage.setItem('platform_config', JSON.stringify(config));
};

// Helper function to reset to defaults
export const resetPlatformConfig = (): void => {
  localStorage.removeItem('platform_config');
};
