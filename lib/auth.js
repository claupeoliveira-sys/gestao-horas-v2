import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

const COOKIE_NAME = 'toolbox_session';
const SECRET = process.env.SESSION_SECRET || 'toolbox-dev-secret-change-in-production';

export function encodeSession(payload) {
  const text = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const b64 = Buffer.from(text, 'utf8').toString('base64url');
  const sig = createHmac('sha256', SECRET).update(b64).digest('base64url');
  return b64 + '.' + sig;
}

export function decodeSession(token) {
  if (!token || typeof token !== 'string') return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  try {
    const expected = createHmac('sha256', SECRET).update(b64).digest('base64url');
    if (sig !== expected) return null;
    const json = Buffer.from(b64, 'base64url').toString('utf8');
    const data = JSON.parse(json);
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return decodeSession(token);
}

export function getSessionFromRequest(req) {
  const token = req.cookies?.get?.(COOKIE_NAME)?.value ?? req.headers?.get?.('cookie')?.split(';').find(c => c.trim().startsWith(COOKIE_NAME + '='))?.split('=')[1]?.trim();
  return decodeSession(token);
}

export { COOKIE_NAME };
