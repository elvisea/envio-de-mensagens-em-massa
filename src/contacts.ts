import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'whatsapp-web.js';
import { formatPhoneNumber } from './format-phone-number';
import { maskPhoneNumber } from './mask-phone-number';
import { hasBeenSent } from './sentNumbers';
import { isUnregisteredNumber, registerUnregisteredNumber } from './unregisteredNumbers';
import { validateNumber } from './validate-number';

interface CSVRow {
  ddd1: string;
  telefone1: string;
  ddd2: string;
  telefone2: string;
  [key: string]: string;
}

interface ProcessingStats {
  total: number;
  valid: number;
  invalid: number;
  alreadySent: number;
  duplicates: number;
}

/**
 * Load and process contacts from CSV file
 * Returns a list of valid numbers that haven't received a message yet
 */
export async function loadContactsFromCSV(filename: string = 'minas.csv'): Promise<string[]> {
  try {
    console.log('\n📊 Iniciando processamento do CSV...');
    const filePath = join(__dirname, '..', 'data', filename);
    const fileContent = readFileSync(filePath, 'utf-8');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as CSVRow[];

    const stats: ProcessingStats = {
      total: records.length,
      valid: 0,
      invalid: 0,
      alreadySent: 0,
      duplicates: 0
    };

    console.log(`📝 Total de registros encontrados: ${records.length}`);

    const validNumbers = new Set<string>();

    // Process each CSV row
    for (const row of records) {
      // Process first number
      if (row.ddd1 && row.telefone1) {
        const number = `55${row.ddd1}${row.telefone1.replace(/\D/g, '')}`;

        if (!validateNumber(number)) {
          stats.invalid++;
          continue;
        }

        if (hasBeenSent(number)) {
          console.log(`⏭️  ${maskPhoneNumber(formatPhoneNumber(number))} - Já recebeu mensagem anteriormente`);
          stats.alreadySent++;
          continue;
        }

        if (validNumbers.has(number)) {
          stats.duplicates++;
          continue;
        }

        validNumbers.add(number);
        stats.valid++;
        console.log(`✅ ${maskPhoneNumber(formatPhoneNumber(number))} - Válido para envio`);
      }

      // Process second number
      if (row.ddd2 && row.telefone2) {
        const number = `55${row.ddd2}${row.telefone2.replace(/\D/g, '')}`;

        if (!validateNumber(number)) {
          stats.invalid++;
          continue;
        }

        if (hasBeenSent(number)) {
          console.log(`⏭️  ${maskPhoneNumber(formatPhoneNumber(number))} - Já recebeu mensagem anteriormente`);
          stats.alreadySent++;
          continue;
        }

        if (validNumbers.has(number)) {
          stats.duplicates++;
          continue;
        }

        validNumbers.add(number);
        stats.valid++;
        console.log(`✅ ${maskPhoneNumber(formatPhoneNumber(number))} - Válido para envio`);
      }
    }

    const numbersToSend = Array.from(validNumbers);

    console.log('\n📋 Resumo do Processamento:');
    console.log(`├─ 📬 Total processado: ${stats.total} registros`);
    console.log(`├─ ✅ Válidos para envio: ${stats.valid} números`);
    if (stats.invalid > 0) console.log(`├─ ❌ Inválidos: ${stats.invalid} números`);
    if (stats.alreadySent > 0) console.log(`├─ ⏭️  Já enviados: ${stats.alreadySent} números`);
    if (stats.duplicates > 0) console.log(`└─ 🔄 Duplicados: ${stats.duplicates} números`);
    else console.log(`└─ ✨ Nenhum número duplicado ou inválido encontrado`);

    return numbersToSend;

  } catch (error) {
    console.error('\n❌ Erro ao processar arquivo CSV:');
    if (error instanceof Error) {
      console.error(`└─ ${error.message}`);
      throw new Error(`Erro ao ler arquivo CSV: ${error.message}`);
    }
    throw error;
  }
}

// Sending configurations
export const HOURLY_LIMIT = 1500;  // Temporarily increased to 100 messages

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

// Função que retorna o intervalo de envio
// export const SENDING_INTERVAL = getRandomInterval;
export const SENDING_INTERVAL = getRandomInterval;

export const DAILY_LIMIT = 1500; // Temporarily increased to 1500 messages

export const messageTemplate = `Olá, Dr(a)! 👋

Sou Elvis da BytefulCode. Desenvolvemos soluções digitais específicas para psicólogos.

Ajudamos profissionais como você a:

✨ Atrair mais pacientes com site/landing page profissional
📱 Gerenciar agenda e consultas automaticamente
📋 Controlar prontuários com total segurança (LGPD)
💳 Automatizar cobranças e recibos

Já auxiliamos diversos profissionais da área a otimizarem seu tempo e aumentarem seus resultados.

Podemos conversar sobre como digitalizar seu consultório?

Para conhecer melhor nosso trabalho e ver exemplos de projetos, acesse nossa página:`;

export const lawyerTemplate = `Olá, Dr(a)! 👋

Sou Elvis da BytefulCode. Desenvolvemos soluções digitais específicas para advogados e escritórios de advocacia.

Ajudamos profissionais como você a:

⚖️ Criar sites e landing pages profissionais para captação de clientes
📱 Gerenciar processos e prazos de forma automatizada
📋 Controlar documentos e petições com segurança (LGPD)
💼 Automatizar tarefas administrativas do escritório
⏰ Organizar agenda de audiências e compromissos
💳 Gerenciar cobranças e honorários

Já auxiliamos diversos escritórios a otimizarem seus processos e aumentarem sua carteira de clientes.

Podemos conversar sobre como digitalizar seu escritório?

Para conhecer melhor nosso trabalho e ver exemplos de projetos, acesse nossa página:`;

export const genericTemplate = `Olá! 👋

Sou Elvis da BytefulCode. Somos especialistas em transformação digital para empresas e profissionais.

Desenvolvemos soluções que ajudam negócios a:

🌟 Aumentar visibilidade online com sites e landing pages profissionais
📱 Automatizar processos e gestão do dia a dia
💼 Otimizar tarefas administrativas e burocráticas
📊 Controlar finanças, vendas e resultados
🔒 Gerenciar dados e documentos com segurança (LGPD)
⚡ Reduzir custos operacionais

Nossos clientes relatam:
✅ Mais tempo livre para focar no core business
✅ Aumento significativo na captação de clientes
✅ Redução de custos com processos manuais
✅ Melhor organização e controle do negócio

Que tal uma conversa rápida sobre como podemos ajudar a digitalizar e impulsionar seu negócio?

Para conhecer melhor nosso trabalho e ver casos de sucesso, acesse nossa página:`;

export const linkMessage = `https://bytefulcode.tech`;


export const tonMessage = `Oportunidade imperdível pra você que quer vender no débito e crédito sem pagar mensalidade!

Olá! 👋 Vi que você criou sua empresa recentemente e que tem interesse na maquininha Ton. Quero te mostrar por que agora é o melhor momento pra garantir a sua:

✅ Taxas a partir de 0,74% – uma das menores do mercado
✅ Zero mensalidade – você compra e a máquina é sua!
✅ Receba em até 1 dia útil
✅ Suporte rápido e confiável
✅ Desconto exclusivo por tempo limitado

🔗 Garanta agora sua maquininha com meu link especial:
link oficial da TON: https://bit.ly/3Ygot8q

⚠️ Promoção válida por tempo limitado. Me chama aqui e aproveita antes que acabe! 💬`


export const newTonMessage = `Olá, tudo bem? 👋 Me chamo Ana Luiza e sou consultora oficial da Ton. Estou entrando em contato porque vi que sua empresa foi criada recentemente e acredito que podemos ajudar você a vender com mais facilidade e economia.

Gostaria de compartilhar uma oportunidade especial:

✅ Taxas a partir de 0,74% – uma das menores do mercado
✅ Zero mensalidade – a máquina é sua!
✅ Receba em até 1 dia útil
✅ Suporte rápido e confiável
✅ Desconto exclusivo por tempo limitado

Todas as informações completas estão disponíveis no site oficial da Ton: https://bit.ly/3Ygot8q.

Se preferir, também estou à disposição para te ajudar no que precisar! 💬

⚠️ Promoção válida por tempo limitado. Qualquer dúvida é só me chamar!

Caso não queira receber mensagens, é só me avisar. 😉`

/**
 * Filtra apenas os números que estão registrados no WhatsApp
 * @param numbers Lista de números para verificar
 * @param client Cliente do WhatsApp Web
 * @returns Lista de números registrados no WhatsApp
 */
export async function filterRegisteredNumbers(numbers: string[], client: Client): Promise<string[]> {
  console.log('\n🔍 Verificando números registrados no WhatsApp...');
  const registeredNumbers: string[] = [];
  let checked = 0;
  let skippedKnownUnregistered = 0;

  for (const number of numbers) {
    try {
      // Primeiro verifica se já sabemos que o número não está registrado
      if (isUnregisteredNumber(number)) {
        skippedKnownUnregistered++;
        if (checked % 10 === 0) {
          console.log(`⏭️  ${maskPhoneNumber(formatPhoneNumber(number))} - Já conhecido como não registrado`);
        }
        continue;
      }

      const isRegistered = await client.isRegisteredUser(`${number}@c.us`);
      checked++;
      
      if (isRegistered) {
        registeredNumbers.push(number);
        console.log(`✅ ${maskPhoneNumber(formatPhoneNumber(number))} - Registrado no WhatsApp`);
      } else {
        console.log(`❌ ${maskPhoneNumber(formatPhoneNumber(number))} - Não registrado no WhatsApp`);
        registerUnregisteredNumber(number);
      }

      // Adiciona um pequeno delay entre as verificações para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mostra progresso a cada 10 números verificados
      if (checked % 10 === 0) {
        console.log(`\n📊 Progresso: ${checked}/${numbers.length - skippedKnownUnregistered} números verificados`);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar ${maskPhoneNumber(formatPhoneNumber(number))}: ${error}`);
      // Se houver erro, aguarda um pouco mais antes de continuar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n📋 Resumo da verificação:');
  console.log(`├─ 📱 Total de números: ${numbers.length}`);
  if (skippedKnownUnregistered > 0) {
    console.log(`├─ ⏭️  Pulados (já conhecidos como não registrados): ${skippedKnownUnregistered} números`);
  }
  console.log(`├─ ✅ Registrados: ${registeredNumbers.length} números`);
  console.log(`└─ ❌ Não registrados: ${numbers.length - registeredNumbers.length - skippedKnownUnregistered} números`);

  return registeredNumbers;
}
