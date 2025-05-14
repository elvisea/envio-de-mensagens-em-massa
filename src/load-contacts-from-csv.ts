import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CSVRow, ProcessingStats } from './interfaces';
import { validateNumber } from './utils';
import { Logger } from './utils/logger';

const BATCH_SIZE = 1000; // Tamanho do lote para processamento

/**
 * Processa um número de telefone e retorna o número formatado se válido
 */
function processPhoneNumber(
  ddd: string | undefined,
  telefone: string | undefined,
): string | null {
  if (!ddd || !telefone) return null;

  const number = `55${ddd}${telefone.replace(/\D/g, '')}`;
  return validateNumber(number) ? number : null;
}

/**
 * Processa um lote de registros do CSV
 */
async function processBatch(
  batch: CSVRow[],
  validNumbers: Set<string>,
  stats: ProcessingStats,
  batchIndex: number,
  totalBatches: number
): Promise<void> {
  const batchStartTime = Date.now();
  
  const processPromises = batch.flatMap(row => {
    return [
      Promise.resolve().then(() => {
        const number1 = processPhoneNumber(row.ddd1, row.telefone1);
        if (number1) {
          if (!validNumbers.has(number1)) {
            validNumbers.add(number1);
            stats.valid++;
          } else {
            stats.duplicates++;
          }
        } else if (row.ddd1 && row.telefone1) {
          stats.invalid++;
        }
      }),
      Promise.resolve().then(() => {
        const number2 = processPhoneNumber(row.ddd2, row.telefone2);
        if (number2) {
          if (!validNumbers.has(number2)) {
            validNumbers.add(number2);
            stats.valid++;
          } else {
            stats.duplicates++;
          }
        } else if (row.ddd2 && row.telefone2) {
          stats.invalid++;
        }
      })
    ];
  });

  await Promise.all(processPromises);
  
  Logger.timing(`Tempo de processamento do lote ${batchIndex + 1}/${totalBatches}`, batchStartTime);
  Logger.performance(`Velocidade do lote ${batchIndex + 1}`, batch.length, batchStartTime);
}

/**
 * Carrega e processa contatos do arquivo CSV
 * Retorna uma lista de objetos { number, name }
 */
export async function loadContactsFromCSV(filename: string = 'data.csv'): Promise<{ number: string, name: string }[]> {
  const startTime = Date.now();
  
  try {
    Logger.section('PROCESSAMENTO DE CONTATOS');
    Logger.info(`Iniciando processamento do arquivo: ${filename}`);
    
    const filePath = join(__dirname, '..', 'data', filename);
    const fileContent = readFileSync(filePath, 'utf-8');

    const parseStartTime = Date.now();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as CSVRow[];
    
    Logger.timing('Tempo de parse do CSV', parseStartTime);

    const stats: ProcessingStats = {
      total: records.length,
      valid: 0,
      invalid: 0,
      duplicates: 0
    };

    Logger.info(`Total de registros encontrados: ${records.length}`);

    const validNumbers = new Set<string>();
    const contacts: { number: string, name: string }[] = [];

    // Divide os registros em lotes
    const batches: CSVRow[][] = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      batches.push(records.slice(i, i + BATCH_SIZE));
    }

    Logger.info(`Processando ${batches.length} lotes de até ${BATCH_SIZE} registros cada...`);

    // Processa os lotes sequencialmente para não sobrecarregar a memória
    for (const [index, batch] of batches.entries()) {
      Logger.separator();
      Logger.info(`Processando lote ${index + 1}/${batches.length}...`);
      for (const row of batch) {
        const name = row.nome_socio?.trim() || row.nome_representante?.trim() || '';
        const number1 = processPhoneNumber(row.ddd1, row.telefone1);
        if (number1 && !validNumbers.has(number1)) {
          validNumbers.add(number1);
          contacts.push({ number: number1, name });
          stats.valid++;
        } else if (row.ddd1 && row.telefone1) {
          stats.invalid++;
        }
        const number2 = processPhoneNumber(row.ddd2, row.telefone2);
        if (number2 && !validNumbers.has(number2)) {
          validNumbers.add(number2);
          contacts.push({ number: number2, name });
          stats.valid++;
        } else if (row.ddd2 && row.telefone2) {
          stats.invalid++;
        }
      }
    }

    // Log do resumo final
    Logger.separator();
    Logger.timingSummary('Resumo do Processamento', startTime);
    
    Logger.summary('Estatísticas', {
      'Total de registros extraídos do CSV': stats.total,
      'Total de registros válidos': stats.valid,
      'Total de registros inválidos': stats.invalid,
      'Total de registros duplicados': stats.duplicates
    });

    Logger.summary('Performance', {
      'Média total': `${(stats.total / (Date.now() - startTime) * 1000).toFixed(2)} registros/segundo`,
      'Média por lote': `${(stats.total / batches.length / (BATCH_SIZE / 1000)).toFixed(2)} registros/segundo`
    });

    return contacts;

  } catch (error) {
    Logger.error('Erro ao processar arquivo CSV');
    Logger.timing('Tempo até o erro', startTime);
    
    if (error instanceof Error) {
      throw new Error(`Erro ao ler arquivo CSV: ${error.message}`);
    }
    throw error;
  }
}

