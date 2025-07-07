import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  console.log(`🔍 Middleware: ${req.method} ${req.nextUrl.pathname}`);
  
  let supabaseResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check for manual auth cookie first
  const authCookie = req.cookies.get('supabase-auth-token');
  let user = null;
  let session = null;

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      if (authData.user && authData.access_token) {
        user = authData.user;
        session = authData;
        console.log(`🍪 Found manual auth cookie for:`, user.email);
      }
    } catch (err) {
      console.log(`❌ Error parsing auth cookie:`, err);
    }
  }

  // Fall back to Supabase session if no manual cookie
  if (!user) {
    const {
      data: { session: supabaseSession },
      error
    } = await supabase.auth.getSession();

    session = supabaseSession;
    user = session?.user;

    console.log(`🔍 Supabase session check:`, user ? user.email : 'No user');
    console.log(`🍪 Session exists:`, !!session);
    if (error) console.log(`❌ Auth error:`, error);
  }

  console.log(`👤 Final user in middleware:`, user ? user.email : 'No user');

  const url = req.nextUrl.clone();

  // Skip auth check for login and auth callback routes
  if (url.pathname === "/login" || url.pathname.startsWith("/auth/")) {
    console.log("Skipping auth check for:", url.pathname);
    return supabaseResponse;
  }

  if (!user) {
    console.log("No user, redirecting to login");
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && !user.email?.endsWith("@carbonrobotics.com")) {
    console.log("Domain check failed for:", user.email);
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};