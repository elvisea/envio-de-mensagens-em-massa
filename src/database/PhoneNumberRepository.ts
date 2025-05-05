import { Database as SQLiteDB } from 'sqlite';
import { Database as SQLiteDatabase } from 'sqlite3';

import { BulkPhoneInsert, PhoneNumber, WhatsAppStatus } from '../interfaces';
import { Database } from './Database';

export class PhoneNumberRepository {
  private db!: SQLiteDB<SQLiteDatabase>;

  async initialize() {
    this.db = await Database.getConnection();
  }

  /**
   * Adiciona ou atualiza um número de telefone no banco
   */
  async addOrUpdatePhone(phoneNumber: string, csvFilename: string) {
    const now = new Date().toISOString();
    
    await this.db.run(
      `INSERT INTO phone_numbers (
        phone_number, 
        status,
        csv_filename, 
        first_seen_at, 
        last_updated_at
      ) VALUES (?, 'pending', ?, ?, ?)
      ON CONFLICT(phone_number) DO UPDATE SET
        last_updated_at = ?,
        csv_filename = ?`,
      [phoneNumber, csvFilename, now, now, now, csvFilename]
    );
  }

  /**
   * Adiciona ou atualiza múltiplos números de telefone no banco em uma única transação
   */
  async addOrUpdatePhonesBulk(phones: BulkPhoneInsert[]) {
    const now = new Date().toISOString();
    
    try {
      await this.db.run('BEGIN TRANSACTION');
      
      const stmt = await this.db.prepare(`
        INSERT INTO phone_numbers (
          phone_number, 
          status,
          csv_filename, 
          first_seen_at, 
          last_updated_at
        ) VALUES (?, 'pending', ?, ?, ?)
        ON CONFLICT(phone_number) DO UPDATE SET
          last_updated_at = ?,
          csv_filename = ?
      `);

      for (const { phoneNumber, csvFilename } of phones) {
        await stmt.run([phoneNumber, csvFilename, now, now, now, csvFilename]);
      }

      await stmt.finalize();
      await this.db.run('COMMIT');
      
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Atualiza o status de registro no WhatsApp de um número
   */
  async updateWhatsAppStatus(phoneNumber: string, isRegistered: boolean) {
    await this.db.run(
      `UPDATE phone_numbers 
       SET is_whatsapp_registered = ?,
           last_updated_at = CURRENT_TIMESTAMP
       WHERE phone_number = ?`,
      [isRegistered, phoneNumber]
    );
  }

  /**
   * Atualiza o status de registro no WhatsApp de múltiplos números em uma única transação
   */
  async updateWhatsAppStatusBulk(statuses: WhatsAppStatus[]) {
    try {
      await this.db.run('BEGIN TRANSACTION');
      
      const stmt = await this.db.prepare(`
        UPDATE phone_numbers 
        SET is_whatsapp_registered = ?,
            last_updated_at = CURRENT_TIMESTAMP
        WHERE phone_number = ?
      `);

      for (const { phoneNumber, isRegistered } of statuses) {
        await stmt.run([isRegistered, phoneNumber]);
      }

      await stmt.finalize();
      await this.db.run('COMMIT');
      
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Marca uma mensagem como enviada com sucesso
   */
  async markMessageAsSent(phoneNumber: string, campaign?: string) {
    await this.db.run(
      `UPDATE phone_numbers 
       SET status = 'sent',
           sent_at = CURRENT_TIMESTAMP,
           campaign = ?,
           is_whatsapp_registered = true,
           last_updated_at = CURRENT_TIMESTAMP
       WHERE phone_number = ?`,
      [campaign, phoneNumber]
    );
  }

  /**
   * Marca uma mensagem como falha no envio
   */
  async markMessageAsFailed(phoneNumber: string, errorMessage: string) {
    await this.db.run(
      `UPDATE phone_numbers 
       SET status = 'failed',
           error_message = ?,
           retry_count = retry_count + 1,
           last_updated_at = CURRENT_TIMESTAMP
       WHERE phone_number = ?`,
      [errorMessage, phoneNumber]
    );
  }

  /**
   * Retorna números pendentes que estão registrados no WhatsApp
   */
  async getPendingRegisteredNumbers(): Promise<PhoneNumber[]> {
    const numbers = await this.db.all<PhoneNumber[]>(`
      SELECT * FROM phone_numbers 
      WHERE status = 'pending' 
      AND is_whatsapp_registered = true
      ORDER BY first_seen_at ASC
    `);
    return numbers || [];
  }

  /**
   * Retorna números que falharam no envio para retry
   */
  async getFailedNumbers(): Promise<PhoneNumber[]> {
    const numbers = await this.db.all<PhoneNumber[]>(`
      SELECT * FROM phone_numbers 
      WHERE status = 'failed' 
      AND retry_count < 3
      ORDER BY last_updated_at ASC
    `);
    return numbers || [];
  }

  /**
   * Verifica se um número já foi processado (enviado ou falhou)
   */
  async isNumberProcessed(phoneNumber: string): Promise<boolean> {
    const result = await this.db.get(
      `SELECT 1 FROM phone_numbers 
       WHERE phone_number = ? 
       AND status IN ('sent', 'failed')`,
      [phoneNumber]
    );
    return !!result;
  }

  /**
   * Retorna estatísticas gerais
   */
  async getStats() {
    const stats = await this.db.all(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN is_whatsapp_registered THEN 1 ELSE 0 END) as whatsapp_registered,
        SUM(CASE WHEN status = 'failed' AND retry_count < 3 THEN 1 ELSE 0 END) as retryable
      FROM phone_numbers
    `);
    return stats[0] || { total: 0, pending: 0, sent: 0, failed: 0, whatsapp_registered: 0, retryable: 0 };
  }

  /**
   * Retorna estatísticas por arquivo CSV e campanha
   */
  async getStatsByFile() {
    const stats = await this.db.all(`
      SELECT 
        csv_filename,
        campaign,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN is_whatsapp_registered THEN 1 ELSE 0 END) as whatsapp_registered
      FROM phone_numbers
      GROUP BY csv_filename, campaign
      ORDER BY csv_filename, campaign
    `);
    return stats || [];
  }

  /**
   * Limpa números antigos que já foram processados
   */
  async cleanOldProcessedNumbers(daysOld: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.db.run(
      `DELETE FROM phone_numbers 
       WHERE status = 'sent' 
       AND sent_at < ?`,
      [cutoffDate.toISOString()]
    );
  }

  /**
   * Fecha a conexão com o banco
   */
  async close() {
    await Database.closeConnection();
  }
} 