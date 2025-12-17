import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup');

  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
  const isPublicApiRoute = request.nextUrl.pathname.startsWith('/api/user/signup') ||
    request.nextUrl.pathname.startsWith('/api/migrate');

  // Allow API auth routes and public API routes
  if (isApiAuthRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected page without token
  if (!isAuthPage && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth pages with valid token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|api/user/signup|api/migrate|_next/static|_next/image|favicon.svg|public).*)',
  ],
};
