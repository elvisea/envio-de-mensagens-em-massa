/**
 * Utilitário para formatação de logs
 */
export class Logger {
  private static readonly LINE_WIDTH = 80;
  private static readonly SEPARATOR = '─'.repeat(Logger.LINE_WIDTH);
  private static readonly DOUBLE_SEPARATOR = '═'.repeat(Logger.LINE_WIDTH);
  private static readonly MIN_TIME = 0.001; // 1ms mínimo para evitar divisão por zero

  /**
   * Formata números para exibição
   */
  private static formatNumber(num: number): string {
    if (!isFinite(num) || num < 0) return '0';
    
    // Limita números muito grandes
    if (num > 100000) return '> 100k';
    
    // Remove decimais desnecessários
    if (num > 1000) return Math.round(num).toLocaleString('pt-BR');
    
    // Formata com até 2 casas decimais
    const formatted = num.toFixed(2).replace(/\.?0+$/, '');
    return formatted === '0' ? '< 1' : formatted;
  }

  /**
   * Formata o tempo decorrido em uma string legível
   */
  private static formatElapsedTime(startTime: number): string {
    const elapsed = Math.max(Date.now() - startTime, 1); // Mínimo 1ms
    
    if (elapsed < 10) return '< 0.01s';
    
    const seconds = (elapsed / 1000).toFixed(2).replace(/\.?0+$/, '');
    const minutes = (elapsed / 60000).toFixed(2);
    
    return elapsed < 60000 
      ? `${seconds}s` 
      : `${minutes}min (${seconds}s)`;
  }

  /**
   * Calcula a taxa de processamento (itens/segundo)
   */
  private static calculateRate(items: number, elapsed: number): number {
    const seconds = Math.max(elapsed / 1000, this.MIN_TIME);
    return items / seconds;
  }

  /**
   * Imprime informações de tempo de processamento
   */
  static timing(description: string, startTime: number): void {
    console.log(`⏱️  ${description}: ${this.formatElapsedTime(startTime)}`);
  }

  /**
   * Imprime estatísticas de performance
   */
  static performance(description: string, itemsProcessed: number, startTime: number): void {
    const elapsed = Date.now() - startTime;
    const rate = this.calculateRate(itemsProcessed, elapsed);
    console.log(`📊 ${description}: ${this.formatNumber(rate)} itens/segundo`);
  }

  /**
   * Imprime um resumo de tempo de processamento
   */
  static timingSummary(title: string, startTime: number, endTime: number = Date.now()): void {
    console.log(`\n⏱️  ${title}:`);
    console.log(`├─ Início: ${new Date(startTime).toLocaleString()}`);
    console.log(`├─ Fim: ${new Date(endTime).toLocaleString()}`);
    console.log(`└─ Tempo total: ${this.formatElapsedTime(startTime)}`);
  }

  /**
   * Imprime um cabeçalho de seção
   */
  static section(title: string): void {
    console.log('\n' + this.DOUBLE_SEPARATOR);
    console.log(title.toUpperCase());
    console.log(this.DOUBLE_SEPARATOR + '\n');
  }

  /**
   * Imprime uma mensagem de status
   */
  static status(message: string): void {
    console.log(`📊 ${message}`);
  }

  /**
   * Imprime uma mensagem de progresso
   */
  static progress(current: number, total: number, label: string): void {
    const percentage = this.formatNumber((current / total) * 100);
    console.log(`└─ 🔄 ${label}: ${current}/${total} (${percentage}%)`);
  }

  /**
   * Imprime uma mensagem de sucesso
   */
  static success(message: string): void {
    console.log(`✅ ${message}`);
  }

  /**
   * Imprime uma mensagem de erro
   */
  static error(message: string, error?: Error | string): void {
    console.error(`❌ ${message}`);
    if (error) {
      console.error(`   └─ ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Imprime uma mensagem de espera
   */
  static wait(message: string): void {
    console.log(`⏳ ${message}`);
  }

  /**
   * Imprime uma mensagem de informação
   */
  static info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Imprime uma mensagem de alerta
   */
  static warning(message: string): void {
    console.log(`⚠️  ${message}`);
  }

  /**
   * Imprime um resumo com estatísticas
   */
  static summary(title: string, stats: Record<string, number | string>): void {
    console.log(`\n📋 ${title}:`);
    
    const entries = Object.entries(stats);
    const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
    
    entries.forEach(([key, value], index) => {
      const padding = ' '.repeat(maxKeyLength - key.length);
      const prefix = index === entries.length - 1 ? '└─' : '├─';
      const formattedValue = typeof value === 'number' ? this.formatNumber(value) : value;
      console.log(`${prefix} ${key}${padding}: ${formattedValue}`);
    });
  }

  /**
   * Imprime uma linha separadora
   */
  static separator(): void {
    console.log('\n' + this.SEPARATOR);
  }

  /**
   * Limpa a linha atual do console
   */
  static clearLine(): void {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }

  /**
   * Imprime uma mensagem na mesma linha (útil para progresso)
   */
  static sameLine(message: string): void {
    this.clearLine();
    process.stdout.write(message);
  }

  /**
   * Imprime uma mensagem de processamento
   */
  static processing(current: number, total: number, number: string): void {
    this.separator();
    console.log(`📬 PROCESSANDO MENSAGEM ${current}/${total}`);
    console.log(`├─ 📱 Número: ${number}`);
    console.log(`└─ 🔄 Progresso: ${this.formatNumber((current/total)*100)}%`);
    this.separator();
  }

  /**
   * Imprime status do envio
   */
  static sendingStatus(hourly: number, hourlyLimit: number, daily: number, dailyLimit: number): void {
    console.log('\n📊 Status do Envio:');
    console.log(`├─ ⏱️  Última hora: ${hourly}/${hourlyLimit}`);
    console.log(`└─ 📅 Hoje: ${daily}/${dailyLimit}\n`);
  }
} 