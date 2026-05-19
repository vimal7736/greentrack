import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[PROXY] Incoming Request: ${pathname}`);
  
  let supabaseResponse = NextResponse.next({ request });

  const publicPrefixes = [
    "/login", "/signup", "/auth/callback",
    "/privacy", "/terms",
    "/api/webhooks/stripe",
    "/api/auth",
    "/api/contact",
    "/api/org/discovery",
    "/api/org/request-join",
    "/verify-email",
    "/admin-login",
    "/manifest.json",
  ];

  const isPublic = pathname === "/" || publicPrefixes.some((p) => pathname.startsWith(p));

  const isBypass = isPublic && pathname !== "/" && pathname !== "/login" && pathname !== "/signup";
  if (isBypass) {
    return supabaseResponse;
  }

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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (pathname.includes("/api/org")) {
    console.log(`[PROXY] API Check: ${pathname} | isPublic: ${isPublic} | user: ${!!user}`);
  }

  if (!user && !isPublic) {
    console.log(`[PROXY] REDIRECTING ${pathname} -> /login`);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
