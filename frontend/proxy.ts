import { NextResponse, type NextRequest } from 'next/server';
import { DISCUSSIONS } from '@/lib/mock-data';

/**
 * Known discussion slugs, checked before the route ever renders.
 *
 * A `notFound()` thrown inside the streamed part of a Cache Components
 * render keeps the static shell's HTTP 200 (documented Next.js behaviour:
 * “Before streaming starts, Next.js returns a 404 status code. After
 * streaming starts, the status code remains 200 and the not-found UI
 * renders”). Intercepting the request here lets the router serve the
 * branded not-found page with a real 404 status instead.
 *
 * Phase 4 note: replace the mock list with a cheap lookup against Strapi
 * (or an edge cache of its slugs).
 */
const KNOWN_SLUGS = new Set(DISCUSSIONS.map((d) => d.slug));

export function proxy(request: NextRequest) {
  let slug: string;
  try {
    slug = decodeURIComponent(request.nextUrl.pathname.slice('/discussions/'.length));
  } catch {
    slug = '';
  }

  if (slug && KNOWN_SLUGS.has(slug)) {
    return NextResponse.next();
  }

  // Rewrite to an unmatched path (outside this matcher): the router renders
  // the app/not-found page with HTTP 404 while the browser keeps the URL.
  return NextResponse.rewrite(new URL('/discussion-inconnue', request.url));
}

export const config = {
  matcher: ['/discussions/:slug'],
};
