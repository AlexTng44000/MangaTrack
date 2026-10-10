import 'dotenv/config';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
    throw new Error(
        'La variable DATABASE_URL est obligatoire',
    );
}

export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
});