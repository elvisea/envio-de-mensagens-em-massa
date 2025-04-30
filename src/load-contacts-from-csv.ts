import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';


import { CSVRow, ProcessingStats } from './interfaces';
import { formatPhoneNumber, maskPhoneNumber, validateNumber } from './utils';


/**
 * Processa um número de telefone e o adiciona ao conjunto de números válidos
 */
function processPhoneNumber(
  ddd: string | undefined,
  telefone: string | undefined,
  validNumbers: Set<string>,
  stats: ProcessingStats
): void {
  if (!ddd || !telefone) return;

  const number = `55${ddd}${telefone.replace(/\D/g, '')}`;

  if (!validateNumber(number)) {
    stats.invalid++;
    return;
  }

  if (validNumbers.has(number)) {
    stats.duplicates++;
    return;
  }

  validNumbers.add(number);
  stats.valid++;
  console.log(`✅ ${maskPhoneNumber(formatPhoneNumber(number))} - Número válido`);
}

/**
 * Carrega e processa contatos do arquivo CSV
 * Retorna uma lista de números válidos
 */
export async function loadContactsFromCSV(filename: string = 'data.csv'): Promise<string[]> {
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
      duplicates: 0
    };

    console.log(`📝 Total de registros encontrados: ${records.length}`);

    const validNumbers = new Set<string>();

    // Processa cada linha do CSV
    for (const row of records) {
      processPhoneNumber(row.ddd1, row.telefone1, validNumbers, stats);
      processPhoneNumber(row.ddd2, row.telefone2, validNumbers, stats);
    }

    const numbersToProcess = Array.from(validNumbers);

    console.log('\n📋 Resumo do Processamento:');
    console.log(`├─ 📬 Total processado: ${stats.total} registros`);
    console.log(`├─ ✅ Válidos: ${stats.valid} números`);
    if (stats.invalid > 0) console.log(`├─ ❌ Inválidos: ${stats.invalid} números`);
    if (stats.duplicates > 0) console.log(`└─ 🔄 Duplicados: ${stats.duplicates} números`);
    else console.log(`└─ ✨ Nenhum número duplicado ou inválido encontrado`);

    return numbersToProcess;

  } catch (error) {
    console.error('\n❌ Erro ao processar arquivo CSV:');
    if (error instanceof Error) {
      console.error(`└─ ${error.message}`);
      throw new Error(`Erro ao ler arquivo CSV: ${error.message}`);
    }
    throw error;
  }
}

