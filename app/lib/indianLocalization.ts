// Utility functions for Indian localization

/**
 * Format date to Indian format (dd/mm/yyyy)
 * @param date - Date string or Date object
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatIndianDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format date to Indian format with time (dd/mm/yyyy, hh:mm AM/PM)
 * @param date - Date string or Date object
 * @returns Formatted date string with time
 */
export function formatIndianDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const dateStr = formatIndianDate(dateObj);
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return `${dateStr}, ${timeStr}`;
}

/**
 * Convert date from dd/mm/yyyy format to ISO format (yyyy-mm-dd) for input fields
 * @param indianDate - Date string in dd/mm/yyyy format
 * @returns ISO date string for input fields
 */
export function indianDateToISO(indianDate: string): string {
  const parts = indianDate.split('/');
  if (parts.length !== 3) {
    return '';
  }
  
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  
  return `${year}-${month}-${day}`;
}

/**
 * Convert ISO date (yyyy-mm-dd) to Indian format (dd/mm/yyyy)
 * @param isoDate - ISO date string
 * @returns Indian format date string
 */
export function isoToIndianDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return '';
  }
  
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  return `${day}/${month}/${year}`;
}

/**
 * Format currency amount in Indian Rupees
 * @param amount - Number to format as currency
 * @returns Formatted currency string with ₹ symbol
 */
export function formatIndianCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Format large currency amounts with Indian numbering system (lakhs, crores)
 * @param amount - Number to format
 * @returns Formatted currency with Indian numbering system
 */
export function formatIndianCurrencyLarge(amount: number): string {
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) { // 1 thousand
    return `₹${(amount / 1000).toFixed(2)} K`;
  } else {
    return formatIndianCurrency(amount);
  }
}
