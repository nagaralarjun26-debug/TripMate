// src/lib/formatCurrency.js
/**
 * Formats a number as Indian Rupee currency.
 * Uses Intl.NumberFormat with the 'en-IN' locale.
 *
 * @param {number|string} value - Numeric value to format.
 * @param {object} [options] - Optional overrides for the formatter.
 * @returns {string} Formatted currency string, e.g. "₹ 1,234.56"
 */
export const formatCurrency = (value, options = {}) => {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(number)) return '₹ 0';
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
  return formatter.format(number);
};
