import { NextRequest } from 'next/server';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'mcdo_exam_secret_2025_very_secure';

export function createAdminToken(): string {
  const payload = { admin: true, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const [data, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return payload.admin && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getAdminToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookie = req.cookies.get('admin_token');
  return cookie?.value || null;
}

export function requireAdmin(req: NextRequest): boolean {
  const token = getAdminToken(req);
  return token ? verifyAdminToken(token) : false;
}
