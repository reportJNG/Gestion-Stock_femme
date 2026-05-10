import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions, SetAllCookies } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  const redirectWithAuthCookies = (path: string) => {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  };

  const clearSupabaseAuthCookies = () => {
    request.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
      .forEach((cookie) => {
        request.cookies.delete(cookie.name);
        response.cookies.set({
          name: cookie.name,
          value: '',
          maxAge: 0,
          path: '/',
        });
      });
  };

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth if env missing
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...(options as CookieOptions),
            });
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    clearSupabaseAuthCookies();
  }

  // LOGIN PAGE
  if (pathname.startsWith('/connexion')) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Worker redirect
      if (profile?.role === 'worker') {
        return redirectWithAuthCookies('/scanner');
      }

      // Admin redirect
      return redirectWithAuthCookies('/tableau-de-bord');
    }

    return response;
  }

  // ROOT
  if (pathname === '/') {
    if (!user) {
      return redirectWithAuthCookies('/connexion');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Worker root redirect
    if (profile?.role === 'worker') {
      return redirectWithAuthCookies('/scanner');
    }

    // Admin root redirect
    return redirectWithAuthCookies('/tableau-de-bord');
  }

  // PROTECTED ROUTES
  if (!user) {
    return redirectWithAuthCookies('/connexion');
  }

  // CHECK PROFILE
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  // Invalid profile
  if (
    !profile ||
    profile.is_active !== true
  ) {
    await supabase.auth.signOut();

    return redirectWithAuthCookies('/connexion');
  }

  // Invalid role
  if (
    profile.role !== 'admin' &&
    profile.role !== 'worker'
  ) {
    await supabase.auth.signOut();

    return redirectWithAuthCookies('/connexion');
  }

  // WORKER ACCESS CONTROL
  if (profile.role === 'worker') {
    const workerAllowedRoutes = [
      '/scanner',
      '/stock',
      '/connexion',
      '/ventes',
    ];

    const isAllowed = workerAllowedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Block unauthorized pages
    if (!isAllowed) {
      return redirectWithAuthCookies('/scanner');
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons).*)',
  ],
};
