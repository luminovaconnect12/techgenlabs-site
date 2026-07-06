import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-prod');

export async function hash(pw) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPw(pw, h) {
  return bcrypt.compare(pw, h);
}
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
export function getToken(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/cms_token=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}
export async function requireAuth(req) {
  const t = getToken(req);
  return t ? verifyToken(t) : null;
}
export function readBody(req) {
  // Vercel parses JSON bodies automatically, but guard for string bodies.
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body || '{}');
  } catch {
    return {};
  }
}
