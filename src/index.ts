import * as qrcode from 'qrcode-terminal';
import { client } from './config/whatsapp';
import { PhoneNumberRepository } from './database/PhoneNumberRepository';
import env from './env';
import { loadContactsFromCSV } from './load-contacts-from-csv';
import { newTonMessage } from './messages';
import { delay, formatPhoneNumber, getRandomInterval, maskPhoneNumber } from './utils';
import { Logger } from './utils/logger';

let hourlyMessagesSent = 0;
let dailyMessagesSent = 0;
let lastHourReset = Date.now();
let lastDayReset = Date.now();

const LIMITS_DAILY = env.limits.daily;
const LIMITS_HOURLY = env.limits.hourly;

const phoneNumberRepository = new PhoneNumberRepository();
phoneNumberRepository.initialize();

// Generate QR Code for authentication
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  Logger.info('Escaneie o QR Code acima para conectar ao WhatsApp Web');
});

// Add error handler for Puppeteer errors
client.on('disconnected', async (reason) => {
  Logger.error('Cliente desconectado', String(reason));
  try {
    await client.destroy();
    Logger.info('Reiniciando cliente...');
    client.initialize();
  } catch (error) {
    Logger.error('Erro ao reiniciar cliente', error instanceof Error ? error : String(error));
    process.exit(1);
  }
});

// Add connection state handler
client.on('change_state', state => {
  Logger.info(`Estado alterado: ${state}`);
});

// Add authentication state handler
client.on('authenticated', () => {
  Logger.success('Cliente autenticado com sucesso!');
});

// Add ready state handler with retry logic
client.on('ready', async () => {
  Logger.success('WhatsApp conectado com sucesso!');
  
  try {
    Logger.section('INICIANDO NOVO PROCESSO');

    // Load contacts from CSV
    let allContacts = await loadContactsFromCSV();
    
    if (allContacts.length === 0) {
      Logger.error('Nenhum número válido para envio.');
      process.exit(0);
    }

    for (const number of allContacts) {
      // Registra o número como pendente
      await phoneNumberRepository.addOrUpdatePhone(number, 'imported-contacts');

      // Verifica no WhatsApp
      const isRegistered = await client.isRegisteredUser(`${number}@c.us`);

      // Atualiza o status do número
      await phoneNumberRepository.updateWhatsAppStatus(number, isRegistered);

      if (isRegistered) {
        Logger.success(`${maskPhoneNumber(formatPhoneNumber(number))}`);
      } else {
        Logger.error(`${maskPhoneNumber(formatPhoneNumber(number))}`);
      }
    }

    // Agora podemos começar o envio
    const numbersToProcess = (await phoneNumberRepository.getPendingRegisteredNumbers())
      .map(phone => phone.phone_number);
  
    if (numbersToProcess.length > 0) {
      Logger.info(`\nIniciando envio para ${numbersToProcess.length} números...`);
    } else {
      const stats = await phoneNumberRepository.getStats();
      Logger.summary('Estatísticas', stats);
      Logger.error('Nenhum número registrado no WhatsApp e pendente de envio encontrado no banco de dados.');
      process.exit(0);
    }

    Logger.section('PREPARANDO ENVIO DE MENSAGENS');
    Logger.status(`Total de números válidos: ${numbersToProcess.length}`);
    Logger.status(`Limite por hora: ${LIMITS_HOURLY}`);
    Logger.status(`Intervalo entre envios: 1-30s (aleatório)`);
    
    Logger.wait('Aguardando 5 segundos antes de iniciar...');
    await delay(5000);
    await sendBulkMessages(numbersToProcess);
  } catch (error) {
    Logger.error('Erro ao carregar contatos', error instanceof Error ? error : String(error));
    process.exit(1);
  }
});

// Function to send bulk messages
async function sendBulkMessages(numbersToProcess: string[]) {
  Logger.section('INICIANDO ENVIO EM MASSA');
  
  Logger.summary('Resumo da Configuração', {
    'Total de contatos': numbersToProcess.length,
    'Limite por hora': LIMITS_HOURLY,
    'Limite diário': LIMITS_DAILY,
    'Intervalo entre envios': '1-30s (aleatório)',
    'Pausa a cada 50 mensagens': '1 minuto'
  });
  
  for (const [index, number] of numbersToProcess.entries()) {
    try {
      const currentBatch = Math.floor(index / 50) + 1;
      const totalBatches = Math.ceil(numbersToProcess.length / 50);

      // Pausa a cada 50 mensagens
      if (index > 0 && index % 50 === 0) {
        Logger.section(`PAUSA PROGRAMADA - LOTE ${currentBatch-1} FINALIZADO`);
        
        Logger.summary('Status do Envio', {
          'Mensagens enviadas': `${index}/${numbersToProcess.length}`,
          'Progresso': `${((index/numbersToProcess.length)*100).toFixed(1)}%`,
          'Lotes processados': `${currentBatch-1}/${totalBatches}`
        });
        
        Logger.wait('Iniciando pausa de 1 minuto...');
        await delay(60000);
        Logger.success('Pausa finalizada, retomando envios...');
      }

      Logger.separator();
      Logger.status(`PROCESSANDO MENSAGEM ${index + 1}/${numbersToProcess.length}`);
      Logger.progress(index + 1, numbersToProcess.length, 'Progresso');
      Logger.info(`Número: ${maskPhoneNumber(formatPhoneNumber(number))}`);
      Logger.info(`Lote atual: ${currentBatch}/${totalBatches}`);

      // Check daily limit
      const now = Date.now();
      if (now - lastDayReset >= 86400000) {
        dailyMessagesSent = 0;
        lastDayReset = now;
        Logger.info('REINICIANDO CONTADOR DIÁRIO');
        Logger.info(`Novo período iniciado: ${new Date().toLocaleString()}`);
      }

      if (dailyMessagesSent >= LIMITS_DAILY) {
        Logger.warning('LIMITE DIÁRIO ATINGIDO');
        Logger.summary('Status', {
          'Mensagens enviadas hoje': dailyMessagesSent,
          'Limite diário': LIMITS_DAILY
        });
        Logger.wait('Aguardando próximo período...');
        await delay(86400000 - (now - lastDayReset));
        dailyMessagesSent = 0;
        lastDayReset = Date.now();
        Logger.success('Novo período diário iniciado!');
      }

      // Check hourly limit
      if (now - lastHourReset >= 3600000) {
        hourlyMessagesSent = 0;
        lastHourReset = now;
        Logger.info('REINICIANDO CONTADOR HORÁRIO');
        Logger.info(`Nova hora iniciada: ${new Date().toLocaleString()}`);
      }

      if (hourlyMessagesSent >= LIMITS_HOURLY) {
        Logger.warning('LIMITE HORÁRIO ATINGIDO');
        Logger.summary('Status', {
          'Mensagens enviadas na hora': hourlyMessagesSent,
          'Limite por hora': LIMITS_HOURLY
        });
        Logger.wait('Aguardando próxima hora...');
        await delay(3600000 - (now - lastHourReset));
        hourlyMessagesSent = 0;
        lastHourReset = Date.now();
        Logger.success('Nova hora iniciada!');
      }

      // Send message
      Logger.sameLine('📤 Enviando mensagem... ');
      await client.sendMessage(`${number}@c.us`, newTonMessage);
      Logger.success('Mensagem enviada com sucesso!');
      
      // Marca o número como enviado no banco
      await phoneNumberRepository.markMessageAsSent(number, 'whatsapp-campaign');
      
      hourlyMessagesSent++;
      dailyMessagesSent++;

      // Status após envio
      Logger.summary('Status do Envio', {
        'Mensagens na última hora': `${hourlyMessagesSent}/${LIMITS_HOURLY}`,
        'Mensagens hoje': `${dailyMessagesSent}/${LIMITS_DAILY}`
      });
      
      // Wait interval before next contact
      if (index < numbersToProcess.length - 1) {
        const interval = getRandomInterval();
        Logger.wait(`Aguardando ${interval/1000}s antes do próximo envio...`);
        await delay(interval);
      }
      
    } catch (error) {
      Logger.error('ERRO NO ENVIO');
      Logger.error(`Número: ${maskPhoneNumber(formatPhoneNumber(number))}`);
      Logger.error('Detalhes do erro', error instanceof Error ? error : String(error));
      
      // Marca o erro no banco
      await phoneNumberRepository.markMessageAsFailed(number, error instanceof Error ? error.message : String(error));
      
      if (index < numbersToProcess.length - 1) {
        Logger.wait('Aguardando 30 segundos antes de tentar o próximo número...');
        await delay(30000);
      }
    }
  }
  
  Logger.section('PROCESSO FINALIZADO');
  
  Logger.summary('Resumo Final', {
    'Total de mensagens processadas': numbersToProcess.length,
    'Data de conclusão': new Date().toLocaleString(),
    'Status': 'Processo finalizado com sucesso!'
  });

  await phoneNumberRepository.getStats();
  
  // Fecha a conexão com o banco
  await phoneNumberRepository.close();
  
  process.exit(0);
}

// Initialize client
client.initialize();