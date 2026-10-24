import { NextResponse, type NextRequest } from 'next/server';
import { STRAPI_BASE_URL } from '@/lib/strapi';

/**
 * Real-slug handling (Phase 4): a discussion exists only if Strapi answers
 * for its documentId. Unknown references are rewritten before the route ever
 * renders, letting the router serve the branded not-found page with a real
 * HTTP 404 status instead of a streamed-shell 200 (Cache Components keeps
 * the status 200 once streaming has started).
 *
 * Runs on the Node.js runtime (Proxy default), so a brief connectivity
 * failure to Strapi degrades to a pass-through: the app then renders its own
 * error state instead of wrongly 404-ing real content.
 */

const LOOKUP_TIMEOUT_MS = 2_500;

export async function proxy(request: NextRequest) {
  let slug: string;
  try {
    slug = decodeURIComponent(request.nextUrl.pathname.slice('/discussions/'.length));
  } catch {
    slug = '';
  }

  if (!slug) {
    return NextResponse.rewrite(new URL('/discussion-inconnue', request.url));
  }

  let exists: boolean;
  try {
    const res = await fetch(`${STRAPI_BASE_URL}/api/discussions/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    exists = res.status === 200;
  } catch {
    // Strapi unreachable: fail open, the app renders its own error state.
    exists = true;
  }

  if (exists) {
    return NextResponse.next();
  }

  // Rewrite to an unmatched path (outside this matcher): the router renders
  // the app/not-found page with HTTP 404 while the browser keeps the URL.
  return NextResponse.rewrite(new URL('/discussion-inconnue', request.url));
}

export const config = {
  matcher: ['/discussions/:slug'],
};
