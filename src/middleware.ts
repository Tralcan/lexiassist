'use server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log(`\n[Middleware] Running for path: ${request.nextUrl.pathname}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  
  if (user) {
    console.log(`[Middleware] User found: ${user.email}`);
  } else {
    console.log('[Middleware] No user found in session.');
  }

  const publicPaths = ['/', '/login'];

  if (!user && !publicPaths.includes(pathname)) {
    console.log(`[Middleware] User not found and path is protected. Redirecting to /login.`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && pathname === '/login') {
    console.log(`[Middleware] User is logged in and trying to access /login. Redirecting to /chat.`);
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  if (pathname.startsWith('/admin')) {
      if (!user) {
         console.log(`[Middleware] No user, but trying to access /admin. Redirecting to /login.`);
         return NextResponse.redirect(new URL('/login', request.url));
      }

      console.log(`[Middleware] User ${user.id} trying to access /admin. Checking profile...`);
      const { data: profile, error } = await supabase
        .from('lex_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
          console.error(`[Middleware] Error fetching profile:`, error.message);
      }

      console.log(`[Middleware] Profile query result:`, profile);

      if (profile?.role !== 'admin') {
          console.log(`[Middleware] User is not an admin (role: ${profile?.role}). Redirecting to /chat.`);
          return NextResponse.redirect(new URL('/chat', request.url));
      }

      console.log('[Middleware] User is admin. Allowing access to /admin.');
  }

  console.log('[Middleware] Continuing to next response.');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
