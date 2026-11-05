import pg from 'pg';
import { ENV } from '../config/env.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!pool) {
    if (!ENV.DATABASE_URL) {
      console.warn('[Database] DATABASE_URL not set. Running with default local postgres.');
    }

    const isCloudDb = ENV.DATABASE_URL?.includes('supabase') || 
                      ENV.DATABASE_URL?.includes('render') || 
                      ENV.DATABASE_URL?.includes('neon') ||
                      ENV.DATABASE_URL?.includes('sslmode=require');

    pool = new Pool({
      connectionString: ENV.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dokkaebi_midnight',
      ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[Database] Unexpected error on idle client:', err);
    });
  }
  return pool;
}
