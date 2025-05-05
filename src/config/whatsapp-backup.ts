import { Client, ClientOptions, LocalAuth } from 'whatsapp-web.js';
import env from '../env';

// Configuração da autenticação
const authConfig = {
  dataPath: `./sessions/${env.whatsapp.sessionName}`,
  clientId: 'client-one'
} as const;

// Argumentos do Puppeteer
const puppeteerArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-software-rasterizer',
  '--disable-features=site-per-process',
  '--disable-web-security'
];

// Configuração do Puppeteer
const puppeteerConfig = {
  headless: true,
  args: puppeteerArgs,
  executablePath: '/usr/bin/google-chrome',
  defaultViewport: null,
  handleSIGINT: true,
  handleSIGTERM: true,
  handleSIGHUP: true
} as const;

// Configurações do cliente WhatsApp
const clientConfig: ClientOptions = {
  authStrategy: new LocalAuth(authConfig),
  puppeteer: puppeteerConfig,
  qrMaxRetries: 5,
  takeoverOnConflict: true,
  takeoverTimeoutMs: 10000,
  restartOnAuthFail: true
} as const;

// Exporta o cliente configurado
export const client = new Client(clientConfig); 