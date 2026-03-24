import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export function getAuthUser(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): JWTPayload {
  const user = getAuthUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function requireAdmin(request: NextRequest): JWTPayload {
  const user = requireAuth(request);
  if (user.role !== 'admin') throw new Error('Forbidden');
  return user;
}
