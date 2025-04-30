/**
 * Format a phone number for display (55DD9XXXXXXXX -> (DD) XXXX-XXXX or (DD) XXXXX-XXXX)
 */
export function formatPhoneNumber(number: string): string {
  // Remove o prefixo 55 e formata
  const ddd = number.slice(2, 4);
  const phone = number.slice(4);
  
  // Se o número tem 8 dígitos (fixo) -> (DD) XXXX-XXXX
  // Se o número tem 9 dígitos (celular) -> (DD) XXXXX-XXXX
  if (phone.length === 8) {
    return `(${ddd}) ${phone.slice(0, 4)}-${phone.slice(4)}`;
  } else {
    return `(${ddd}) ${phone.slice(0, 5)}-${phone.slice(5)}`;
  }
}

// Helper function for delay
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gera um intervalo aleatório entre 1 e 30 segundos (1000-30000ms)
 * para tornar o envio de mensagens mais natural e menos detectável
 */
export function getRandomInterval(): number {
  const minSeconds = 1;
  const maxSeconds = 30;
  const randomSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  return randomSeconds * 1000; // Convertendo para milissegundos
}

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

/**
 * Validates if a number is in the correct format (12 or 13 digits starting with 55)
 */
export function validateNumber(number: string): boolean {
  return /^55\d{10,11}$/.test(number);
}