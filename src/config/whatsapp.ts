import { Client, LocalAuth } from 'whatsapp-web.js';
import env from '../env';

const SESSION_NAME = env.whatsapp.sessionName;

export const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: `./sessions/${SESSION_NAME}`,
    clientId: 'client-one'
  }),
  puppeteer: {
    headless: true,
    args: [
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
    ],
    executablePath: '/usr/bin/google-chrome',
    defaultViewport: null,
    handleSIGINT: true,
    handleSIGTERM: true,
    handleSIGHUP: true
  },
  qrMaxRetries: 5,
  takeoverOnConflict: true,
  takeoverTimeoutMs: 10000,
  restartOnAuthFail: true
}); 