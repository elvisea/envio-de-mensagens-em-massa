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