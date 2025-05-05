import * as qrcode from 'qrcode-terminal';
import { client } from './config/whatsapp';
import { counters, LIMITS } from './constants';
import { PhoneNumberRepository } from './database/PhoneNumberRepository';
import env from './env';
import { loadContactsFromCSV } from './load-contacts-from-csv';
import { messageVariants } from './messages';
import { delay, formatPhoneNumber, maskPhoneNumber } from './utils';
import { Logger } from './utils/logger';

// Inicialização do repositório
const phoneNumberRepository = new PhoneNumberRepository();
phoneNumberRepository.initialize();

// Configuração dos eventos do cliente WhatsApp
function setupWhatsAppEvents(): void {
  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    Logger.info('Escaneie o QR Code acima para conectar ao WhatsApp Web');
  });

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

  client.on('change_state', state => {
    Logger.info(`Estado alterado: ${state}`);
  });

  client.on('authenticated', () => {
    Logger.success('Cliente autenticado com sucesso!');
  });

  client.on('ready', handleClientReady);
}

// Gerenciamento de limites de envio
async function handleMessageLimits(): Promise<void> {
  const now = Date.now();

  // Verificação do limite diário
  if (now - counters.lastDayReset >= 86400000) {
    counters.daily = 0;
    counters.lastDayReset = now;
    Logger.info('REINICIANDO CONTADOR DIÁRIO');
    Logger.info(`Novo período iniciado: ${new Date().toLocaleString()}`);
  }

  if (counters.daily >= LIMITS.DAILY) {
    Logger.warning('LIMITE DIÁRIO ATINGIDO');
    Logger.summary('Status', {
      'Mensagens enviadas hoje': counters.daily,
      'Limite diário': LIMITS.DAILY
    });
    Logger.wait('Aguardando próximo período...');
    await delay(86400000 - (now - counters.lastDayReset));
    counters.daily = 0;
    counters.lastDayReset = Date.now();
    Logger.success('Novo período diário iniciado!');
  }

  // Verificação do limite horário
  if (now - counters.lastHourReset >= 3600000) {
    counters.hourly = 0;
    counters.lastHourReset = now;
    Logger.info('REINICIANDO CONTADOR HORÁRIO');
    Logger.info(`Nova hora iniciada: ${new Date().toLocaleString()}`);
  }

  if (counters.hourly >= LIMITS.HOURLY) {
    Logger.warning('LIMITE HORÁRIO ATINGIDO');
    Logger.summary('Status', {
      'Mensagens enviadas na hora': counters.hourly,
      'Limite por hora': LIMITS.HOURLY
    });
    Logger.wait('Aguardando próxima hora...');
    await delay(3600000 - (now - counters.lastHourReset));
    counters.hourly = 0;
    counters.lastHourReset = Date.now();
    Logger.success('Nova hora iniciada!');
  }
}

// Processamento de lote de mensagens
async function processBatch(numbers: string[], startIndex: number, batchNumber: number, totalBatches: number): Promise<void> {
  const endIndex = Math.min(startIndex + LIMITS.BATCH_SIZE, numbers.length);
  const batch = numbers.slice(startIndex, endIndex);

  for (const [index, number] of batch.entries()) {
    const globalIndex = startIndex + index;
    
    Logger.separator();
    Logger.status(`PROCESSANDO MENSAGEM ${globalIndex + 1}/${numbers.length}`);
    Logger.progress(globalIndex + 1, numbers.length, 'Progresso');
    Logger.info(`Número: ${maskPhoneNumber(formatPhoneNumber(number))}`);
    Logger.info(`Lote atual: ${batchNumber}/${totalBatches}`);

    try {
      await handleMessageLimits();
      
      Logger.sameLine('📤 Enviando mensagem... ');
      const randomMessage = messageVariants[Math.floor(Math.random() * messageVariants.length)];
      await client.sendMessage(`${number}@c.us`, randomMessage);
      Logger.success('Mensagem enviada com sucesso!');
      
      await phoneNumberRepository.markMessageAsSent(number, 'whatsapp-campaign');
      
      counters.hourly++;
      counters.daily++;

      Logger.summary('Status do Envio', {
        'Mensagens na última hora': `${counters.hourly}/${LIMITS.HOURLY}`,
        'Mensagens hoje': `${counters.daily}/${LIMITS.DAILY}`
      });

      if (index < batch.length - 1) {
        const interval = env.limits.messageInterval;
        
        Logger.wait(`Aguardando ${interval/1000}s antes do próximo envio...`);
        await delay(interval);
      }
    } catch (error) {
      Logger.error('ERRO NO ENVIO');
      Logger.error(`Número: ${maskPhoneNumber(formatPhoneNumber(number))}`);
      Logger.error('Detalhes do erro', error instanceof Error ? error : String(error));
      
      await phoneNumberRepository.markMessageAsFailed(number, error instanceof Error ? error.message : String(error));
      
      if (index < batch.length - 1) {
        Logger.wait('Aguardando 30 segundos antes de tentar o próximo número...');
        await delay(LIMITS.ERROR_RETRY_DELAY);
      }
    }
  }

  // Pausa entre lotes
  if (endIndex < numbers.length) {
    Logger.section(`PAUSA PROGRAMADA - LOTE ${batchNumber} FINALIZADO`);
    
    Logger.summary('Status do Envio', {
      'Mensagens enviadas': `${endIndex}/${numbers.length}`,
      'Progresso': `${((endIndex/numbers.length)*100).toFixed(1)}%`,
      'Lotes processados': `${batchNumber}/${totalBatches}`
    });
    
    Logger.wait('Iniciando pausa de 1 minuto...');
    await delay(LIMITS.PAUSE_DURATION);
    Logger.success('Pausa finalizada, retomando envios...');
  }
}

// Processamento principal de envio em massa
async function sendBulkMessages(numbersToProcess: string[]): Promise<void> {
  Logger.section('INICIANDO ENVIO EM MASSA');
  
  Logger.summary('Resumo da Configuração', {
    'Total de contatos': numbersToProcess.length,
    'Limite por hora': LIMITS.HOURLY,
    'Limite diário': LIMITS.DAILY,
    'Intervalo entre envios': `${LIMITS.MIN_SECONDS}-${LIMITS.MAX_SECONDS}s (aleatório)`,
    'Pausa a cada 50 mensagens': '1 minuto'
  });

  const totalBatches = Math.ceil(numbersToProcess.length / LIMITS.BATCH_SIZE);
  
  for (let i = 0; i < numbersToProcess.length; i += LIMITS.BATCH_SIZE) {
    const batchNumber = Math.floor(i / LIMITS.BATCH_SIZE) + 1;
    await processBatch(numbersToProcess, i, batchNumber, totalBatches);
  }
  
  Logger.section('PROCESSO FINALIZADO');
  
  Logger.summary('Resumo Final', {
    'Total de mensagens processadas': numbersToProcess.length,
    'Data de conclusão': new Date().toLocaleString(),
    'Status': 'Processo finalizado com sucesso!'
  });

  await phoneNumberRepository.getStats();
  await phoneNumberRepository.close();
  
  process.exit(0);
}

// Handler para quando o cliente está pronto
async function handleClientReady(): Promise<void> {
  Logger.success('WhatsApp conectado com sucesso!');

  try {
    Logger.section('INICIANDO NOVO PROCESSO');

    // 1. Carregar todos os contatos válidos do CSV
    const allContacts = await loadContactsFromCSV();
    if (allContacts.length === 0) {
      Logger.error('Nenhum número válido para envio.');
      process.exit(0);
    }

    // 2. Inserir todos os contatos no banco em lotes
    const BATCH_SIZE = 100;
    for (let i = 0; i < allContacts.length; i += BATCH_SIZE) {
      await phoneNumberRepository.addOrUpdatePhonesBulk(
        allContacts.slice(i, i + BATCH_SIZE).map(number => ({
          phoneNumber: number,
          csvFilename: 'data'
        }))
      );
    }

    // 3. Atualizar status de WhatsApp de todos os contatos em lotes
    for (let i = 0; i < allContacts.length; i += BATCH_SIZE) {
      const batch = allContacts.slice(i, i + BATCH_SIZE);
      const whatsappChecks = await Promise.all(
        batch.map(async (number) => {
          const isRegistered = await client.isRegisteredUser(`${number}@c.us`);
          return { phoneNumber: number, isRegistered };
        })
      );
      await phoneNumberRepository.updateWhatsAppStatusBulk(whatsappChecks);
    }

    // 4. Buscar todos os contatos válidos e registrados para envio
    const numbersPending = await phoneNumberRepository.getPendingRegisteredNumbers();
    Logger.status(`Total de números pendentes: ${numbersPending.length}`);

    // 5. Processar os números pendentes
    const numbersToProcess = numbersPending.map(phone => phone.phone_number);
    Logger.status(`Total de números válidos: ${numbersToProcess.length}`);

    if (numbersToProcess.length === 0) {
      const stats = await phoneNumberRepository.getStats();
      Logger.summary('Estatísticas', stats);
      Logger.error('Nenhum número registrado no WhatsApp e pendente de envio encontrado no banco de dados.');
      process.exit(0);
    }

    Logger.section('PREPARANDO ENVIO DE MENSAGENS');
    Logger.status(`Total de números pendentes de envio: ${numbersToProcess.length}`);
    Logger.status(`Limite por hora: ${LIMITS.HOURLY}`);
    Logger.status(`Intervalo entre envios: ${LIMITS.MIN_SECONDS}-${LIMITS.MAX_SECONDS}s (aleatório)`);
    Logger.wait('Aguardando 5 segundos antes de iniciar...');
    await delay(5000);

    // 6. Enviar as mensagens em massa
    await sendBulkMessages(numbersToProcess);
  } catch (error) {
    Logger.error('Erro ao carregar contatos', error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

// Inicialização da aplicação
setupWhatsAppEvents();
client.initialize();