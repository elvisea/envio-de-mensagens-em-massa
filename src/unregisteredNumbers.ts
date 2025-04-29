import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const UNREGISTERED_NUMBERS_FILE = join(__dirname, '..', 'data', 'unregistered-numbers.json');

interface UnregisteredNumbersData {
  numbers: string[];
  lastUpdated: string;
}

/**
 * Initialize unregistered numbers tracking system
 */
export function initializeUnregisteredNumbers(): void {
  if (!existsSync(UNREGISTERED_NUMBERS_FILE)) {
    const initialData: UnregisteredNumbersData = {
      numbers: [],
      lastUpdated: new Date().toISOString()
    };
    writeFileSync(UNREGISTERED_NUMBERS_FILE, JSON.stringify(initialData, null, 2));
    console.log('📝 Arquivo de números não registrados criado');
  }
}

/**
 * Get list of unregistered numbers
 */
export function getUnregisteredNumbers(): string[] {
  try {
    if (!existsSync(UNREGISTERED_NUMBERS_FILE)) {
      return [];
    }
    const data = JSON.parse(readFileSync(UNREGISTERED_NUMBERS_FILE, 'utf-8')) as UnregisteredNumbersData;
    return data.numbers;
  } catch (error) {
    console.error('❌ Erro ao ler números não registrados:', error);
    return [];
  }
}

/**
 * Register a number as unregistered in WhatsApp
 */
export function registerUnregisteredNumber(number: string): void {
  try {
    let data: UnregisteredNumbersData;
    
    if (existsSync(UNREGISTERED_NUMBERS_FILE)) {
      data = JSON.parse(readFileSync(UNREGISTERED_NUMBERS_FILE, 'utf-8'));
    } else {
      data = {
        numbers: [],
        lastUpdated: new Date().toISOString()
      };
    }

    if (!data.numbers.includes(number)) {
      data.numbers.push(number);
      data.lastUpdated = new Date().toISOString();
      writeFileSync(UNREGISTERED_NUMBERS_FILE, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erro ao registrar número não registrado:', error);
  }
}

/**
 * Check if a number is marked as unregistered
 */
export function isUnregisteredNumber(number: string): boolean {
  const unregisteredNumbers = getUnregisteredNumbers();
  return unregisteredNumbers.includes(number);
} 