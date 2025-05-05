export interface CSVRow {
  ddd1: string;
  telefone1: string;
  ddd2: string;
  telefone2: string;
  [key: string]: string;
}

export interface ProcessingStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

// Contadores e limites
export interface MessageCounters {
  hourly: number;
  daily: number;
  lastHourReset: number;
  lastDayReset: number;
}

export interface PhoneNumber {
  phone_number: string;
  status: 'pending' | 'sent' | 'failed';
  is_whatsapp_registered: boolean;
  sent_at?: Date;
  error_message?: string;
  retry_count: number;
  campaign?: string;
  csv_filename: string;
}

export interface BulkPhoneInsert {
  phoneNumber: string;
  csvFilename: string;
}

export interface WhatsAppStatus {
  phoneNumber: string;
  isRegistered: boolean;
}

