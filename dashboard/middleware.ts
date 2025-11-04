import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ko', 'en'];
const defaultLocale = 'ko';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle i18n routing
  const intlResponse = intlMiddleware(request);
  if (intlResponse) {
    // Add the current path to headers
    intlResponse.headers.set('x-pathname', pathname);
    return intlResponse;
  }

  const defaultResponse = NextResponse.next();
  defaultResponse.headers.set('x-pathname', pathname);
  return defaultResponse;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - static files
    // - favicon.ico
    '/((?!api|_next|.*\\..*).*)',
  ],
}; 