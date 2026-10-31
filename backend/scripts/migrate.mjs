import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = await readFile(new URL('../src/infrastructure/database/init.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('Database schema initialized/updated. Existing user data retained.');
} catch (error) {
  // Do not log connection strings, credentials or raw driver errors.
  await client.query('ROLLBACK').catch(() => {});
  console.error('Database migration failed. Check database availability and configuration.');
  process.exitCode = 1;
} finally { await client.end(); }
