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