import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'scm-secret-key-2024-very-secure';

export interface JWTPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
