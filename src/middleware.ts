import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },

        set(
          name: string,
          value: string,
          options: Record<string, unknown>
        ) {
          response.cookies.set({
            name,
            value,
            ...(options as object),
          });
        },

        remove(
          name: string,
          options: Record<string, unknown>
        ) {
          response.cookies.set({
            name,
            value: '',
            ...(options as object),
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // LOGIN PAGE
  if (pathname.startsWith('/connexion')) {
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      // Worker redirect
      if (profile?.role === 'worker') {
        return NextResponse.redirect(
          new URL('/scanner', request.url)
        );
      }

      // Admin redirect
      return NextResponse.redirect(
        new URL('/tableau-de-bord', request.url)
      );
    }

    return response;
  }

  // ROOT
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(
        new URL('/connexion', request.url)
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Worker root redirect
    if (profile?.role === 'worker') {
      return NextResponse.redirect(
        new URL('/scanner', request.url)
      );
    }

    // Admin root redirect
    return NextResponse.redirect(
      new URL('/tableau-de-bord', request.url)
    );
  }

  // PROTECTED ROUTES
  if (!session) {
    return NextResponse.redirect(
      new URL('/connexion', request.url)
    );
  }

  // CHECK PROFILE
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', session.user.id)
    .single();

  // Invalid profile
  if (
    !profile ||
    profile.is_active !== true
  ) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL('/connexion', request.url)
    );
  }

  // Invalid role
  if (
    profile.role !== 'admin' &&
    profile.role !== 'worker'
  ) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL('/connexion', request.url)
    );
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
      return NextResponse.redirect(
        new URL('/scanner', request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html|workbox-.*\\.js).*)',
  ],
};