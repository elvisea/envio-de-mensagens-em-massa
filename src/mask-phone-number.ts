/**
 * Masks the last digits of a formatted phone number for privacy in logs
 * Example: (41) 99999-9999 -> (41) 9999X-XXXX
 */
export function maskPhoneNumber(formattedNumber: string): string {
  const parts = formattedNumber.split('-');
  if (parts.length !== 2) return formattedNumber;
  
  const firstPart = parts[0].slice(0, -1) + 'X';
  const secondPart = 'XXXX';
  
  return `${firstPart}-${secondPart}`;
}