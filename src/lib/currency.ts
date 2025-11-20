/**
 * Currency Formatting Utilities
 *
 * Provides consistent currency formatting across the application.
 * Default: Show full amount in rupees with Indian number format
 * When space is limited: Use Cr/L/K notation
 */

/**
 * Format currency with full amount (Indian number system)
 * Example: 1234567 → "₹12,34,567"
 */
export const formatCurrency = (amount: number): string => {
  // Handle null, undefined, or NaN values
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format currency with compact notation for space-constrained areas
 * Uses Cr (Crore), L (Lakh), K (Thousand) notation
 *
 * @param amount - Amount in rupees
 * @param compact - Whether to use compact format
 * @returns Formatted currency string
 *
 * Examples:
 * - 50000000 (5 crore) → "₹5 Cr" (compact) or "₹50,00,000" (full)
 * - 500000 (5 lakh) → "₹5 L" (compact) or "₹5,00,000" (full)
 * - 50000 (50 thousand) → "₹50 K" (compact) or "₹50,000" (full)
 */
export const formatCurrencyCompact = (amount: number, compact: boolean = false): string => {
  // Handle null, undefined, or NaN values
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  if (!compact) {
    return formatCurrency(amount);
  }

  // Crores (10,000,000+)
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }

  // Lakhs (100,000+)
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  }

  // For amounts less than 1 lakh, show full amount with commas
  return formatCurrency(amount);
};

/**
 * Smart currency formatter - automatically decides between full and compact
 * based on the amount magnitude
 *
 * @param amount - Amount in rupees
 * @param forceCompact - Force compact format regardless of amount
 * @returns Formatted currency string
 */
export const formatCurrencySmart = (amount: number, forceCompact: boolean = false): string => {
  if (forceCompact) {
    return formatCurrencyCompact(amount, true);
  }

  // Use compact format only for very large amounts or when explicitly requested
  if (amount >= 10000000) { // 1 crore+
    return formatCurrencyCompact(amount, true);
  }

  return formatCurrency(amount);
};

/**
 * Format currency for cards and tables (where space might be limited)
 * Shows full amount for amounts < 10L, compact for larger amounts
 */
export const formatCurrencyForCard = (amount: number): string => {
  // For amounts less than 10 lakh, show full number
  if (amount < 1000000) {
    return formatCurrency(amount);
  }

  // For 10L and above, use compact notation
  return formatCurrencyCompact(amount, true);
};

/**
 * Format currency for stat cards and dashboards
 * Uses compact notation for better readability in limited space
 */
export const formatCurrencyForStats = (amount: number): string => {
  return formatCurrencyCompact(amount, true);
};

/**
 * Parse formatted currency back to number
 */
export const parseCurrency = (formattedAmount: string): number => {
  // Remove ₹, commas, and spaces
  const cleaned = formattedAmount.replace(/[₹,\s]/g, '');

  // Handle Cr, L, K notation
  if (cleaned.includes('Cr')) {
    return parseFloat(cleaned.replace('Cr', '')) * 10000000;
  }
  if (cleaned.includes('L')) {
    return parseFloat(cleaned.replace('L', '')) * 100000;
  }
  if (cleaned.includes('K')) {
    return parseFloat(cleaned.replace('K', '')) * 1000;
  }

  return parseFloat(cleaned) || 0;
};

/**
 * Format percentage removing trailing zeros
 * Example: 4.799999 → "4.8", 12.00 → "12", 15.50 → "15.5"
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return parseFloat(value.toFixed(decimals)).toString();
};

/**
 * Format currency for transporter view
 * Shows full number below 100,000, uses K notation for 100,000+
 *
 * @param amount - Amount in rupees
 * @returns Formatted currency string
 *
 * Examples:
 * - 5000 → "₹5,000"
 * - 50000 → "₹50,000"
 * - 95000 → "₹95,000"
 * - 100000 → "₹100K"
 * - 500000 → "₹500K"
 * - 1500000 → "₹1500K"
 */
export const formatCurrencyForTransporter = (amount: number): string => {
  // Below 100,000: Show full number with Indian formatting
  if (amount < 100000) {
    return formatCurrency(amount);
  }

  // 100,000 and above: Use K notation
  return `₹${(amount / 1000).toFixed(0)}K`;
};
