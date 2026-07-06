export default async function handler(req, res) {
  res.setHeader('Set-Cookie', 'cms_token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0');
  res.json({ ok: true });
}
