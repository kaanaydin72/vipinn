// server/db.ts

import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres'; // Artık postgres-js değil
import * as schema from '../shared/schema';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
