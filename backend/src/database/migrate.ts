import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbPool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    // 1. Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied migrations
    const res = await client.query('SELECT version FROM schema_migrations;');
    const appliedVersions = new Set(res.rows.map((row) => row.version));

    // 3. Read migration files from ./migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.warn(`[Migrations] No .sql files found in ${migrationsDir}`);
    }

    for (const file of files) {
      if (!appliedVersions.has(file)) {
        console.log(`[Migrations] Applying ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        await client.query('BEGIN;');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
          await client.query('COMMIT;');
          console.log(`[Migrations] Applied ${file} successfully.`);
        } catch (err) {
          await client.query('ROLLBACK;');
          console.error(`[Migrations] Failed to apply ${file}:`, err);
          throw err;
        }
      }
    }
    console.log('[Migrations] All migrations up to date.');
  } finally {
    client.release();
  }
}

// Allow CLI execution: `tsx src/database/migrate.ts`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
