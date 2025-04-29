import dotenv from 'dotenv';

dotenv.config();

export const config = {
  whatsapp: {
    sessionName: process.env.WHATSAPP_SESSION_NAME || 'default-session',
  },
  sending: {
    intervalMs: parseInt(process.env.MESSAGE_INTERVAL_MS || '5000'),
  },
};