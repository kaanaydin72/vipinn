import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.ts';

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  console.log('Manuel migration başlatılıyor...');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS paytr_settings (
        id SERIAL PRIMARY KEY,
        merchant_id TEXT NOT NULL,
        merchant_key TEXT NOT NULL,
        merchant_salt TEXT NOT NULL,
        test_mode BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('paytr_settings tablosu oluşturuldu');

    await sql`
      CREATE TABLE IF NOT EXISTS paytr_transactions (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER NOT NULL,
        merchant_oid TEXT NOT NULL,
        amount INTEGER NOT NULL,
        token TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        response_data TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('paytr_transactions tablosu oluşturuldu');

    try {
      await sql`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS phone TEXT;`;
      console.log('hotels tablosuna phone sütunu eklendi');
    } catch (error) {
      console.error('hotels tablosuna phone sütunu eklerken hata:', error);
    }

    console.log('Manuel migration başarıyla tamamlandı');
  } catch (error) {
    console.error('Manuel migration sırasında hata:', error);
  } finally {
    await sql.end();
  }
};

main().catch(console.error);
