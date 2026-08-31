import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check admin session cookie
  const adminSessionCookie = request.cookies.get("admin_session")?.value;
  let isAuthenticated = adminSessionCookie === "true";

  // If not already authenticated via admin_session, check Supabase auth
  if (!isAuthenticated) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (supabaseUrl.startsWith("http")) {
      try {
        const supabase = createServerClient(
          supabaseUrl,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll() {},
            },
          }
        );
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          isAuthenticated = true;
        }
      } catch {
        // Ignore auth error
      }
    }
  }

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/delete-account") ||
    pathname.startsWith("/api");

  // If unauthenticated and trying to access protected dashboard route -> redirect to /login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access /login -> redirect to /dashboard
  if (isAuthenticated && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
