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
export const formatCurrency = (amount) => {
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
export const formatCurrencyCompact = (amount, compact = false) => {
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
export const formatCurrencySmart = (amount, forceCompact = false) => {
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
export const formatCurrencyForCard = (amount) => {
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
export const formatCurrencyForStats = (amount) => {
    return formatCurrencyCompact(amount, true);
};
/**
 * Parse formatted currency back to number
 */
export const parseCurrency = (formattedAmount) => {
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
export const formatPercentage = (value, decimals = 2) => {
    return parseFloat(value.toFixed(decimals)).toString();
};
