import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_PREFIX = '/admin';
const LOGIN_REQUIRED_PREFIXES = ['/account', '/cart', '/wishlist', '/checkout', '/order-success'];
const GUEST_ONLY_PATHS = ['/login', '/signup'];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Runs on every request (see src/proxy.ts):
 *  1. refreshes the Supabase login session cookie
 *  2. /admin/*   → only users whose profile role is 'admin'
 *  3. /account, /cart, /wishlist, /checkout, /order-success → only logged-in users
 *  4. /login, /signup → sent home if already logged in
 */
export async function updateSession(request: NextRequest) {
  // Without these two settings nothing can work. Say so clearly instead of a
  // bare "Internal Server Error" (the usual cause: they were not added on Vercel).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !/^https:\/\/.+/.test(url)) {
    const missing = [
      !url ? 'NEXT_PUBLIC_SUPABASE_URL is missing' : !/^https:\/\/.+/.test(url) ? 'NEXT_PUBLIC_SUPABASE_URL must start with https://' : '',
      !key ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing' : '',
    ].filter(Boolean);
    return new NextResponse(
      `Site setup is not finished: ${missing.join('; ')}.\n` +
        'Add it in Vercel → Project → Settings → Environment Variables, then Redeploy. See DEPLOY.md.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getUser():
  // getUser() verifies the session with Supabase and refreshes it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect while keeping any refreshed session cookies.
  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, value);
    }
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (matches(pathname, ADMIN_PREFIX)) {
    if (!user) return redirectTo('/login', { next: pathname });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') return redirectTo('/');
  }

  if (!user && LOGIN_REQUIRED_PREFIXES.some((prefix) => matches(pathname, prefix))) {
    return redirectTo('/login', { next: pathname });
  }

  if (user && GUEST_ONLY_PATHS.includes(pathname)) {
    return redirectTo('/');
  }

  return response;
}
