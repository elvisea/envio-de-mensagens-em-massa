import * as qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { config } from './config';
import {
  DAILY_LIMIT,
  filterRegisteredNumbers,
  HOURLY_LIMIT,
  loadContactsFromCSV,
  newTonMessage
} from './contacts';
import { delay } from './delay';
import { formatPhoneNumber } from './format-phone-number';
import { maskPhoneNumber } from './mask-phone-number';
import { initializeSentNumbers, registerSentNumber } from './sentNumbers';
import { initializeUnregisteredNumbers } from './unregisteredNumbers';

let contacts: string[] = [];
let hourlyMessagesSent = 0;
let dailyMessagesSent = 0;
let lastHourReset = Date.now();
let lastDayReset = Date.now();

// WhatsApp client configuration
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: `./sessions/${config.whatsapp.sessionName}`,
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

// Generate QR Code for authentication
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('📱 Escaneie o QR Code acima para conectar ao WhatsApp Web');
});

// Add error handler for Puppeteer errors
client.on('disconnected', async (reason) => {
  console.log('🔌 Cliente desconectado:', reason);
  try {
    await client.destroy();
    console.log('🔄 Reiniciando cliente...');
    client.initialize();
  } catch (error) {
    console.error('❌ Erro ao reiniciar cliente:', error);
    process.exit(1);
  }
});

// Add connection state handler
client.on('change_state', state => {
  console.log('📡 Estado alterado:', state);
});

// Add authentication state handler
client.on('authenticated', () => {
  console.log('🔐 Cliente autenticado com sucesso!');
});

// Add ready state handler with retry logic
client.on('ready', async () => {
  console.log('✅ WhatsApp conectado com sucesso!');
  
  try {
    console.log('\n################################################################');
    console.log('#                     INICIANDO NOVO PROCESSO                     #');
    console.log('################################################################\n');

    // Initialize sent numbers tracking system
    initializeSentNumbers();
    initializeUnregisteredNumbers();

    // Load contacts from CSV
    let allContacts = await loadContactsFromCSV();
    
    if (allContacts.length === 0) {
      console.log('❌ Nenhum número válido para envio.');
      process.exit(0);
    }

    // Filtra apenas números registrados no WhatsApp
    contacts = await filterRegisteredNumbers(allContacts, client);

    if (contacts.length === 0) {
      console.log('❌ Nenhum número registrado no WhatsApp para envio.');
      process.exit(0);
    }

    console.log('\n🚀 Preparando envio de mensagens...');
    console.log(`├─ 📱 Total de números válidos: ${contacts.length}`);
    console.log(`├─ ⏱️  Limite por hora: ${HOURLY_LIMIT}`);
    console.log(`└─ ⌛ Intervalo entre envios: 1-30s (aleatório)`);
    
    console.log('\n⏳ Aguardando 5 segundos antes de iniciar...');
    await delay(5000);
    await sendBulkMessages();
  } catch (error) {
    console.error('❌ Erro ao carregar contatos:', error);
    process.exit(1);
  }
});

// Function to send bulk messages
async function sendBulkMessages() {
  console.log('\n################################################################');
  console.log('#                     INICIANDO ENVIO EM MASSA                    #');
  console.log('################################################################\n');
  
  console.log('📊 Resumo da Configuração:');
  console.log(`├─ 📱 Total de contatos: ${contacts.length}`);
  console.log(`├─ ⏱️  Limite por hora: ${HOURLY_LIMIT} mensagens`);
  console.log(`├─ 📅 Limite diário: ${DAILY_LIMIT} mensagens`);
  console.log(`├─ ⌛ Intervalo entre envios: 1-30s (aleatório)`);
  console.log(`└─ 🔄 Pausa a cada 50 mensagens: 1 minuto\n`);
  
  for (const [index, number] of contacts.entries()) {
    try {
      const currentBatch = Math.floor(index / 50) + 1;
      const totalBatches = Math.ceil(contacts.length / 50);

      // Pausa a cada 50 mensagens
      if (index > 0 && index % 50 === 0) {
        console.log('\n################################################################');
        console.log(`#                PAUSA PROGRAMADA - LOTE ${currentBatch-1} FINALIZADO              #`);
        console.log('################################################################\n');
        console.log('📊 Status do Envio:');
        console.log(`├─ ✉️  Mensagens enviadas: ${index}/${contacts.length}`);
        console.log(`├─ 📊 Progresso: ${((index/contacts.length)*100).toFixed(1)}%`);
        console.log(`├─ 🔄 Lotes processados: ${currentBatch-1}/${totalBatches}`);
        console.log(`└─ ⏳ Iniciando pausa de 1 minuto...\n`);
        await delay(60000); // 1 minuto
        console.log('✅ Pausa finalizada, retomando envios...\n');
      }

      console.log("#".repeat(100));
      console.log(`📬 PROCESSANDO MENSAGEM ${index + 1}/${contacts.length}`);
      console.log(`├─ 📱 Número: ${maskPhoneNumber(formatPhoneNumber(number))}`);
      console.log(`├─ 📊 Lote atual: ${currentBatch}/${totalBatches}`);
      console.log(`└─ 🔄 Progresso geral: ${((index/contacts.length)*100).toFixed(1)}%`);
      console.log("#".repeat(100));

      // Check daily limit
      const now = Date.now();
      if (now - lastDayReset >= 86400000) {
        dailyMessagesSent = 0;
        lastDayReset = now;
        console.log('\n🔄 REINICIANDO CONTADOR DIÁRIO');
        console.log(`└─ ✨ Novo período iniciado: ${new Date().toLocaleString()}\n`);
      }

      if (dailyMessagesSent >= DAILY_LIMIT) {
        console.log('\n⚠️  LIMITE DIÁRIO ATINGIDO');
        console.log(`├─ 📊 Mensagens enviadas hoje: ${dailyMessagesSent}`);
        console.log(`├─ ⏱️  Limite diário: ${DAILY_LIMIT}`);
        console.log('└─ 🔄 Aguardando próximo período...\n');
        await delay(86400000 - (now - lastDayReset));
        dailyMessagesSent = 0;
        lastDayReset = Date.now();
        console.log('✅ Novo período diário iniciado!\n');
      }

      // Check hourly limit
      if (now - lastHourReset >= 3600000) {
        hourlyMessagesSent = 0;
        lastHourReset = now;
        console.log('\n🔄 REINICIANDO CONTADOR HORÁRIO');
        console.log(`└─ ✨ Nova hora iniciada: ${new Date().toLocaleString()}\n`);
      }

      if (hourlyMessagesSent >= HOURLY_LIMIT) {
        console.log('\n⚠️  LIMITE HORÁRIO ATINGIDO');
        console.log(`├─ 📊 Mensagens enviadas na hora: ${hourlyMessagesSent}`);
        console.log(`├─ ⏱️  Limite por hora: ${HOURLY_LIMIT}`);
        console.log('└─ 🔄 Aguardando próxima hora...\n');
        await delay(3600000 - (now - lastHourReset));
        hourlyMessagesSent = 0;
        lastHourReset = Date.now();
        console.log('✅ Nova hora iniciada!\n');
      }

      // Send message
      process.stdout.write(`📤 Enviando mensagem... `);
      await client.sendMessage(`${number}@c.us`, newTonMessage);
      console.log('✅');
      
      // Register the sent number
      registerSentNumber(number);
      
      hourlyMessagesSent++;
      dailyMessagesSent++;

      // Status após envio
      console.log('\n📊 Status do Envio:');
      console.log(`├─ ⏱️  Mensagens na última hora: ${hourlyMessagesSent}/${HOURLY_LIMIT}`);
      console.log(`└─ 📅 Mensagens hoje: ${dailyMessagesSent}/${DAILY_LIMIT}\n`);
      
      console.log("#".repeat(100));
      
      // Wait interval before next contact
      if (index < contacts.length - 1) {
        // const interval = SENDING_INTERVAL();
        const interval = 1000;
        console.log(`⏳ Aguardando ${interval/1000}s antes do próximo envio...`);
        await delay(interval);
      }
      
    } catch (error) {
      console.log('\n❌ ERRO NO ENVIO');
      console.log(`├─ 📱 Número: ${maskPhoneNumber(formatPhoneNumber(number))}`);
      console.log(`└─ ❌ Erro: ${error instanceof Error ? error.message : error}\n`);
      
      if (index < contacts.length - 1) {
        console.log('⏳ Aguardando 30 segundos antes de tentar o próximo número...\n');
        await delay(30000);
      }
    }
  }
  
  console.log('\n################################################################');
  console.log('#                    PROCESSO FINALIZADO                         #');
  console.log('################################################################\n');
  
  console.log('📊 Resumo Final:');
  console.log(`├─ ✅ Total de mensagens processadas: ${contacts.length}`);
  console.log(`├─ 📅 Data de conclusão: ${new Date().toLocaleString()}`);
  console.log(`└─ ✨ Processo finalizado com sucesso!\n`);
  
  process.exit(0);
}



// Initialize client
client.initialize();