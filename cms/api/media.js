import { sql } from '../lib/db.js';
import { requireAuth, readBody } from '../lib/auth.js';

// Media library. Images stored as base64 data URLs (simple, no extra infra).
// GET  /api/media                 (auth) -> list metadata + data URL
// GET  /api/media?id=5&raw=1      (public) -> serves the raw image
// POST /api/media  (auth) body:{filename,mime,data(base64 dataURL),alt}
// DELETE /api/media?id=5 (auth)
export default async function handler(req, res) {
  const { id, raw } = req.query;

  if (req.method === 'GET' && id && raw) {
    const r = await sql`SELECT mime, data FROM cms_media WHERE id = ${id}`;
    if (!r[0]) return res.status(404).end();
    const b64 = String(r[0].data).replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    res.setHeader('Content-Type', r[0].mime || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.end(buf);
  }

  const auth = await requireAuth(req);
  if (!auth) return res.status(401).json({ error: 'unauthenticated' });

  if (req.method === 'GET') {
    const r = await sql`SELECT id, filename, mime, alt, data, created_at FROM cms_media ORDER BY id DESC`;
    return res.json(r);
  }
  if (req.method === 'POST') {
    const b = readBody(req);
    const r = await sql`INSERT INTO cms_media (filename, mime, data, alt)
      VALUES (${b.filename || 'upload'}, ${b.mime || 'image/png'}, ${b.data || ''}, ${b.alt || ''})
      RETURNING id, filename, mime, alt`;
    return res.json(r[0]);
  }
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' });
    await sql`DELETE FROM cms_media WHERE id = ${id}`;
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'method' });
}
