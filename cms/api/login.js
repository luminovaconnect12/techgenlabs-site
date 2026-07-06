import { sql } from '../lib/db.js';
import { verifyPw, signToken, readBody } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const { email, password } = readBody(req);
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  const rows = await sql`SELECT * FROM cms_users WHERE email = ${String(email).toLowerCase()}`;
  const u = rows[0];
  if (!u || !(await verifyPw(password, u.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = await signToken({ id: u.id, email: u.email, name: u.name, role: u.role });
  res.setHeader('Set-Cookie',
    `cms_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`);
  res.json({ ok: true, user: { email: u.email, name: u.name, role: u.role } });
}
