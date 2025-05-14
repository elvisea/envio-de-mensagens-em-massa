import { Database as SQLiteDB, open } from 'sqlite';
import { Database as SQLiteDatabase } from 'sqlite3';

import env from '../env';

export class Database {
  private static instance: SQLiteDB<SQLiteDatabase> | undefined;

  static async initialize(): Promise<SQLiteDB<SQLiteDatabase>> {
    if (!this.instance) {
      this.instance = await open({
        filename: env.database.filePath,
        driver: SQLiteDatabase
      });

      await this.createTables();
      console.log('✅ Banco de dados inicializado com sucesso');
    }

    return this.instance;
  }

  private static async createTables() {
    if (!this.instance) {
      throw new Error('Database instance not initialized');
    }

    await this.instance.exec(`
      CREATE TABLE IF NOT EXISTS phone_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
        is_whatsapp_registered BOOLEAN NOT NULL DEFAULT false,
        first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        campaign TEXT,
        csv_filename TEXT,
        name TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_phone_status 
      ON phone_numbers(status);
      
      CREATE INDEX IF NOT EXISTS idx_phone_whatsapp 
      ON phone_numbers(is_whatsapp_registered);

      CREATE INDEX IF NOT EXISTS idx_phone_campaign
      ON phone_numbers(campaign);
    `);
  }

  static async getConnection(): Promise<SQLiteDB<SQLiteDatabase>> {
    if (!this.instance) {
      await this.initialize();
    }
    
    if (!this.instance) {
      throw new Error('Failed to initialize database connection');
    }

    return this.instance;
  }

  static async closeConnection() {
    if (this.instance) {
      await this.instance.close();
      this.instance = undefined;
      console.log('✅ Conexão com o banco de dados fechada');
    }
  }
} 