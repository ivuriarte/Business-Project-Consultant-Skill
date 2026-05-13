import { NextRequest, NextResponse } from 'next/server';

/**
 * Generates a per-request CSP nonce and injects it into:
 *  - the Content-Security-Policy *response* header   (enforced by the browser)
 *  - the x-nonce *request* header                    (Next.js reads this to stamp
 *    its own inline hydration scripts, React runtime, etc.)
 *
 * Without this, Next.js inline scripts are blocked by a strict CSP, which
 * prevents React from hydrating and leaves the UI completely non-interactive.
 *
 * Static security headers (X-Frame-Options, HSTS, etc.) remain in next.config.ts
 * because they apply to every response including API routes.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://va.vercel-insights.com;
    frame-ancestors 'none';
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Some older Next.js versions also read the CSP from the request headers.
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - api/           (API routes don't render HTML — no CSP needed)
     *   - _next/static   (compiled JS/CSS assets)
     *   - _next/image    (image optimisation service)
     *   - favicon.ico    (browser built-in)
     * Also skip Next.js RSC prefetch requests (next-router-prefetch header)
     * to avoid generating a new nonce for every client navigation prefetch.
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon\\.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
