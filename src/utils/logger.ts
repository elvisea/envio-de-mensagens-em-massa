/**
 * Utilitário para formatação de logs
 */
export class Logger {
  private static readonly LINE_WIDTH = 80;
  private static readonly SEPARATOR = '─'.repeat(Logger.LINE_WIDTH);
  private static readonly DOUBLE_SEPARATOR = '═'.repeat(Logger.LINE_WIDTH);

  /**
   * Imprime um cabeçalho de seção
   */
  static section(title: string): void {
    console.log('\n' + this.DOUBLE_SEPARATOR);
    console.log(title.toUpperCase());
    console.log(this.DOUBLE_SEPARATOR);
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
    const percentage = ((current / total) * 100).toFixed(1);
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
      console.log(`${prefix} ${key}${padding}: ${value}`);
    });
    console.log('');
  }

  /**
   * Imprime uma linha separadora
   */
  static separator(): void {
    console.log(this.SEPARATOR);
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
    console.log(`└─ 🔄 Progresso: ${((current/total)*100).toFixed(1)}%`);
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