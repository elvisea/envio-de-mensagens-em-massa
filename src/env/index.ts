import 'dotenv/config';

/**
 * Configuração do ambiente da aplicação
 */
const env = {
  /**
   * Configurações do Ambiente
   */
  app: {
    /** Ambiente atual (development, production, test) */
    nodeEnv: process.env.NODE_ENV || 'development',
    /** Porta do servidor */
    port: parseInt(process.env.PORT || '3000'),
  },

  /**
   * Configurações do Banco de Dados
   */
  database: {
    /** Caminho do arquivo do banco SQLite */
    filePath: process.env.FILE_PATH || './data/messages.db',
  },

  /**
   * Configurações do WhatsApp
   */
  whatsapp: {
    /** Nome da sessão do WhatsApp */
    sessionName: process.env.WHATSAPP_SESSION_NAME || 'default-session',
  },

  /**
   * Configurações de Limites de Envio
   */
  limits: {
    /** Limite diário de mensagens */
    daily: parseInt(process.env.DAILY_LIMIT || '1500'),
    /** Limite por hora de mensagens */
    hourly: parseInt(process.env.HOURLY_LIMIT || '100'),
    /** Intervalo entre mensagens (em ms) */
    messageInterval: parseInt(process.env.MESSAGE_INTERVAL_MS || '5000'),
  },

  /**
   * Valida se todas as variáveis de ambiente necessárias estão definidas
   */
  validate() {
    const requiredEnvs: Array<keyof typeof process.env> = [
      'NODE_ENV',
      'WHATSAPP_SESSION_NAME',
      'DAILY_LIMIT',
      'HOURLY_LIMIT'
    ];

    const missingEnvs = requiredEnvs.filter(key => !process.env[key]);

    if (missingEnvs.length > 0) {
      throw new Error(
        `❌ Variáveis de ambiente faltando:\n${missingEnvs.map(key => `   - ${key}`).join('\n')}\n` +
        `💡 Copie o arquivo .env.example para .env e preencha as variáveis necessárias.`
      );
    }

    if (this.limits.daily < 1) {
      throw new Error('❌ DAILY_LIMIT deve ser maior que 0');
    }

    if (this.limits.hourly < 1) {
      throw new Error('❌ HOURLY_LIMIT deve ser maior que 0');
    }

    if (this.limits.hourly > this.limits.daily) {
      throw new Error('❌ HOURLY_LIMIT não pode ser maior que DAILY_LIMIT');
    }

    if (this.limits.messageInterval < 1000) {
      throw new Error('❌ MESSAGE_INTERVAL_MS deve ser pelo menos 1000 (1 segundo)');
    }

    return true;
  }
} as const;

// Valida as variáveis de ambiente ao importar
env.validate();

export default env;
export type Env = typeof env;