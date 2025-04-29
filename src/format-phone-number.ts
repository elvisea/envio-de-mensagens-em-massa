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