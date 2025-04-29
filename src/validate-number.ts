/**
 * Validates if a number is in the correct format (12 or 13 digits starting with 55)
 */
export function validateNumber(number: string): boolean {
  return /^55\d{10,11}$/.test(number);
}