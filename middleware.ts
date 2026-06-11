import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, NON_DEFAULT_LOCALES } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';

const NON_DEFAULT_SET = new Set<string>(NON_DEFAULT_LOCALES);

function detectLocale(pathname: string): { locale: Locale; strippedPath: string } {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (first === defaultLocale) {
    const rest = segments.slice(1).join('/');
    return { locale: defaultLocale, strippedPath: rest ? `/${rest}` : '/' };
  }

  if (first && NON_DEFAULT_SET.has(first)) {
    const rest = segments.slice(1).join('/');
    return { locale: first as Locale, strippedPath: rest ? `/${rest}` : '/' };
  }

  return { locale: defaultLocale, strippedPath: pathname };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API and auth routes bypass locale handling
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    return handleSupabase(request);
  }

  const { locale, strippedPath } = detectLocale(pathname);

  // Redirect explicit /en/... to bare path (canonical form)
  if (pathname.split('/').filter(Boolean)[0] === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = strippedPath;
    return NextResponse.redirect(url, 308);
  }

  // Prevent locale-prefixed API/auth access
  if (strippedPath.startsWith('/api/') || strippedPath.startsWith('/auth/')) {
    const url = request.nextUrl.clone();
    url.pathname = strippedPath;
    return NextResponse.redirect(url, 308);
  }

  // Create new request headers with x-locale so server components can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  let rewriteUrl: URL | undefined;

  if (locale === defaultLocale && !NON_DEFAULT_SET.has(pathname.split('/').filter(Boolean)[0] ?? '')) {
    rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/en${pathname === '/' ? '' : pathname}`;
  }

  function makeResponse(): NextResponse {
    if (rewriteUrl) {
      return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      });
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  let supabaseResponse = makeResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value));
          supabaseResponse = makeResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();

  // Set response headers for HTTP caches and clients
  supabaseResponse.headers.set('x-locale', locale);
  supabaseResponse.headers.set('Content-Language', locale);

  return supabaseResponse;
}

async function handleSupabase(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|xml|txt|json)$).*)',
  ],
};
