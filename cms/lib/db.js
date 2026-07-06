import { neon } from '@neondatabase/serverless';

// Single shared SQL client backed by the Neon serverless (HTTP) driver.
// DATABASE_URL is injected by Vercel when the Neon store is connected.
export const sql = neon(process.env.DATABASE_URL);
