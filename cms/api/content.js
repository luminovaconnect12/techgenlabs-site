import { sql } from '../lib/db.js';
import { requireAuth, readBody } from '../lib/auth.js';

// Generic content API for every collection (pages, posts, services, projects...).
// GET  /api/content?type=pages            -> list (published only if not authed)
// GET  /api/content?type=pages&slug=home  -> single by slug
// GET  /api/content?id=12                  -> single by id
// POST /api/content   (auth)   body: {type,title,slug,status,excerpt,data,blocks}
// PUT  /api/content?id=12 (auth)
// DELETE /api/content?id=12 (auth)
export default async function handler(req, res) {
  const auth = await requireAuth(req);
  const { type, id, slug } = req.query;

  if (req.method === 'GET') {
    if (id) {
      const r = await sql`SELECT * FROM cms_content WHERE id = ${id}`;
      return res.json(r[0] || null);
    }
    if (slug && type) {
      const r = auth
        ? await sql`SELECT * FROM cms_content WHERE type = ${type} AND slug = ${slug}`
        : await sql`SELECT * FROM cms_content WHERE type = ${type} AND slug = ${slug} AND status = 'published'`;
      return res.json(r[0] || null);
    }
    if (!type) return res.status(400).json({ error: 'type required' });
    const r = auth
      ? await sql`SELECT * FROM cms_content WHERE type = ${type} ORDER BY "order" ASC, id DESC`
      : await sql`SELECT * FROM cms_content WHERE type = ${type} AND status = 'published' ORDER BY "order" ASC, id DESC`;
    return res.json(r);
  }

  if (!auth) return res.status(401).json({ error: 'unauthenticated' });
  const b = readBody(req);

  if (req.method === 'POST') {
    const r = await sql`INSERT INTO cms_content (type, slug, title, status, excerpt, data, blocks, "order")
      VALUES (${b.type}, ${b.slug || ''}, ${b.title || 'Untitled'}, ${b.status || 'draft'},
              ${b.excerpt || ''}, ${JSON.stringify(b.data || {})}, ${JSON.stringify(b.blocks || [])}, ${b.order || 0})
      RETURNING *`;
    return res.json(r[0]);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id required' });
    const r = await sql`UPDATE cms_content SET
      slug = ${b.slug || ''}, title = ${b.title || 'Untitled'}, status = ${b.status || 'draft'},
      excerpt = ${b.excerpt || ''}, data = ${JSON.stringify(b.data || {})},
      blocks = ${JSON.stringify(b.blocks || [])}, "order" = ${b.order || 0}, updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return res.json(r[0]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' });
    await sql`DELETE FROM cms_content WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'method' });
}
