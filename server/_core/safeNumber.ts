/**
 * Safe number parsing utilities
 * Prevents NaN and invalid number issues
 */

/**
 * Safely parse a float value with fallback
 * @param value - The value to parse
 * @param fallback - The fallback value if parsing fails (default: 0)
 * @returns The parsed number or fallback
 */
export function safeParseFloat(value: any, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  const parsed = parseFloat(value);
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    console.warn(`[SafeNumber] Invalid float value: ${value}, using fallback: ${fallback}`);
    return fallback;
  }
  
  return parsed;
}

/**
 * Safely parse an integer value with fallback
 * @param value - The value to parse
 * @param fallback - The fallback value if parsing fails (default: 0)
 * @returns The parsed integer or fallback
 */
export function safeParseInt(value: any, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    console.warn(`[SafeNumber] Invalid integer value: ${value}, using fallback: ${fallback}`);
    return fallback;
  }
  
  return parsed;
}

/**
 * Safely perform division with zero check
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param fallback - The fallback value if division is invalid (default: 0)
 * @returns The division result or fallback
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return fallback;
  }
  
  const result = numerator / denominator;
  
  if (!isFinite(result)) {
    return fallback;
  }
  
  return result;
}

/**
 * Safely format a number to fixed decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places
 * @param fallback - The fallback string if formatting fails
 * @returns The formatted string
 */
export function safeToFixed(value: any, decimals: number = 2, fallback: string = "0.00"): string {
  const num = safeParseFloat(value, 0);
  
  if (!isFinite(num)) {
    return fallback;
  }
  
  try {
    return num.toFixed(decimals);
  } catch (error) {
    console.warn(`[SafeNumber] Failed to format number: ${value}`, error);
    return fallback;
  }
}

/**
 * Check if a value is a valid number
 * @param value - The value to check
 * @returns True if the value is a valid finite number
 */
export function isValidNumber(value: any): boolean {
  if (typeof value !== 'number') {
    return false;
  }
  
  return !isNaN(value) && isFinite(value);
}
