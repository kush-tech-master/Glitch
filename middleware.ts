import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and system routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Static files like images, css, js, icons
  ) {
    return NextResponse.next();
  }

  // 2. Allow public pages: Home ('/'), Login ('/login'), and Customer Digital Invoices ('/bill/*')
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/bill/')) {
    // If user is already authenticated and visits /login, redirect to /billing
    const token = request.cookies.get('glitch_auth_token')?.value;
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/billing', request.url));
    }
    return NextResponse.next();
  }

  // 3. For all other routes (e.g. /billing, /billing/history, /billing/settings), require authentication
  const token = request.cookies.get('glitch_auth_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
