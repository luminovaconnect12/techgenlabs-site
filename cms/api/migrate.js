import { sql } from '../lib/db.js';
import { hash } from '../lib/auth.js';

// One-time setup: creates tables + seeds the admin user.
// Protected by SETUP_KEY so it can't be run by anyone.
export default async function handler(req, res) {
  if ((req.query.key || '') !== (process.env.SETUP_KEY || '')) {
    return res.status(403).json({ error: 'forbidden' });
  }

  await sql`CREATE TABLE IF NOT EXISTS cms_users (
    id serial PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text,
    password text NOT NULL,
    role text DEFAULT 'admin',
    created_at timestamptz DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS cms_content (
    id serial PRIMARY KEY,
    type text NOT NULL,
    slug text,
    title text,
    status text DEFAULT 'draft',
    excerpt text,
    data jsonb DEFAULT '{}'::jsonb,
    blocks jsonb DEFAULT '[]'::jsonb,
    "order" int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS cms_media (
    id serial PRIMARY KEY,
    filename text,
    mime text,
    data text,
    alt text,
    created_at timestamptz DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS cms_settings (
    key text PRIMARY KEY,
    value jsonb
  )`;

  const email = (process.env.SEED_EMAIL || 'admin@techgenlabs.com').toLowerCase();
  const pw = process.env.SEED_PASSWORD || 'TechGenAdmin#2026';
  const h = await hash(pw);
  await sql`INSERT INTO cms_users (email, name, password, role)
    VALUES (${email}, 'Administrator', ${h}, 'admin')
    ON CONFLICT (email) DO UPDATE SET password = ${h}, role = 'admin'`;

  const counts = await sql`SELECT
    (SELECT count(*) FROM cms_users) AS users,
    (SELECT count(*) FROM cms_content) AS content,
    (SELECT count(*) FROM cms_media) AS media`;

  res.json({ ok: true, admin: email, counts: counts[0] });
}
