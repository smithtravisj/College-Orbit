import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log('Middleware - Path:', request.nextUrl.pathname, 'Token:', token ? 'exists' : 'null');

  const isLoginSignupPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password');

  const isPublicPage =
    request.nextUrl.pathname.startsWith('/privacy') ||
    request.nextUrl.pathname.startsWith('/terms') ||
    request.nextUrl.pathname.startsWith('/pricing') ||
    request.nextUrl.pathname.startsWith('/clubs') ||
    request.nextUrl.pathname.startsWith('/educators') ||
    request.nextUrl.pathname.startsWith('/partners');

  // Landing page is public - unauthenticated users see landing, authenticated see dashboard
  const isLandingPage = request.nextUrl.pathname === '/';

  // Redirect to login if accessing protected page without token (except landing page)
  if (!isLoginSignupPage && !isPublicPage && !isLandingPage && !token) {
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - opengraph-image (OG image generation)
     * - twitter-image (Twitter image generation)
     * - robots.txt, manifest.json, sitemap.xml
     * - Static files (ico, svg, png, jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|opengraph-image|twitter-image|robots\\.txt|manifest\\.json|sitemap\\.xml|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|html|xml)$).*)',
  ],
};
