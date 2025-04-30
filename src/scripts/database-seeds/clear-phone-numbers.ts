import { open } from 'sqlite';
import { Database as SQLiteDatabase } from 'sqlite3';

import env from '../../env';

async function clearPhoneNumbers() {
  try {
    // Abre conexão com o banco
    const db = await open({
      filename: env.database.filePath,
      driver: SQLiteDatabase
    });

    console.log('Iniciando limpeza da tabela phone_numbers...');

    // Deleta todos os registros
    await db.run('DELETE FROM phone_numbers');
    
    // Reseta o auto-incrementador
    await db.run("DELETE FROM sqlite_sequence WHERE name='phone_numbers'");

    console.log('✅ Todos os registros foram removidos com sucesso!');
    
    await db.close();
    console.log('✅ Conexão com o banco de dados fechada');
  } catch (error) {
    console.error('Erro durante a limpeza:', error);
  }
}

// Executa o script
clearPhoneNumbers(); 