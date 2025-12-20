import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log('Proxy - Path:', request.nextUrl.pathname, 'Token:', token ? 'exists' : 'null');

  const isLoginSignupPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password');

  const isPublicPage =
    request.nextUrl.pathname.startsWith('/privacy') ||
    request.nextUrl.pathname.startsWith('/terms');

  // Redirect to login if accessing protected page without token
  if (!isLoginSignupPage && !isPublicPage && !token) {
    console.log('No token found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing login/signup pages with valid token
  if (isLoginSignupPage && token) {
    console.log('User on auth page with valid token, redirecting to dashboard');
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isLoginSignupPage && !token) {
    console.log('User on auth page without token, allowing access to login/signup');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.svg|public).*)',
  ],
};
