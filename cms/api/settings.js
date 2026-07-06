import { sql } from '../lib/db.js';
import { requireAuth, readBody } from '../lib/auth.js';

// GET  /api/settings          -> all settings as {key:value}
// POST /api/settings (auth)   body: {key, value}
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const r = await sql`SELECT key, value FROM cms_settings`;
    const out = {};
    for (const row of r) out[row.key] = row.value;
    return res.json(out);
  }
  const auth = await requireAuth(req);
  if (!auth) return res.status(401).json({ error: 'unauthenticated' });
  if (req.method === 'POST') {
    const { key, value } = readBody(req);
    await sql`INSERT INTO cms_settings (key, value) VALUES (${key}, ${JSON.stringify(value)})
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}`;
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'method' });
}
