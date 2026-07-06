import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  const auth = await requireAuth(req);
  if (!auth) return res.status(401).json({ error: 'unauthenticated' });
  res.json({ user: { email: auth.email, name: auth.name, role: auth.role } });
}
