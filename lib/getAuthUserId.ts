import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verify } from 'jsonwebtoken';
import { decode } from 'next-auth/jwt';

interface ExtensionTokenPayload {
  userId: string;
  purpose: 'extension';
}

export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  // 1. Try NextAuth JWT cookie
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (token?.id) {
    return token.id as string;
  }

  // 2. Try X-Session-Token header (extension sends NextAuth session token this way
  //    since Cookie header is forbidden in fetch)
  const sessionToken = req.headers.get('x-session-token');
  if (sessionToken) {
    try {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (decoded?.id) {
        return decoded.id as string;
      }
    } catch {
      // Invalid session token
    }
  }

  // 3. Fall back to Authorization: Bearer <token> (extension JWT)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7);
    try {
      const secret = process.env.EXTENSION_JWT_SECRET;
      if (!secret) return null;
      const payload = verify(jwt, secret) as ExtensionTokenPayload;
      if (payload.purpose === 'extension' && payload.userId) {
        return payload.userId;
      }
    } catch {
      return null;
    }
  }

  return null;
}
