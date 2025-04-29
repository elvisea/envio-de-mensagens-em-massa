import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SENT_NUMBERS_FILE = join(__dirname, '..', 'data', 'sent-numbers.json');

// Set to store sent numbers in memory
let sentNumbersSet = new Set<string>();

/**
 * Initialize the sent numbers tracking system
 * Loads previously sent numbers from sent-numbers.json
 */
export function initializeSentNumbers(): void {
  try {
    // Load existing numbers from sent-numbers.json if it exists
    if (existsSync(SENT_NUMBERS_FILE)) {
      const fileContent = readFileSync(SENT_NUMBERS_FILE, 'utf-8');
      const existingNumbers = JSON.parse(fileContent) as string[];
      sentNumbersSet = new Set(existingNumbers);
      console.log(`Loaded ${sentNumbersSet.size} previously sent numbers`);
    } else {
      // Create empty file if it doesn't exist
      writeFileSync(SENT_NUMBERS_FILE, '[]');
      console.log('Created new sent numbers tracking file');
    }
  } catch (error) {
    console.error('Error initializing sent numbers:', error);
    sentNumbersSet = new Set<string>();
  }
}

/**
 * Check if a number has already received a message
 */
export function hasBeenSent(number: string): boolean {
  return sentNumbersSet.has(number);
}

/**
 * Register a new number as sent
 */
export function registerSentNumber(number: string): void {
  sentNumbersSet.add(number);
  saveSentNumbers();
}

/**
 * Save the current list of sent numbers to file
 */
function saveSentNumbers(): void {
  try {
    const numbers = Array.from(sentNumbersSet);
    writeFileSync(SENT_NUMBERS_FILE, JSON.stringify(numbers, null, 2));
  } catch (error) {
    console.error('Error saving sent numbers:', error);
  }
} 