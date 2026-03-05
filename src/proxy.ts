import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/requests", "/api/requests", "/api/triage", "/api/agents"];
const PUBLIC_API_PATHS = ["/api/auth", "/api/intake"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow employee-facing paths
  if (
    pathname === "/" ||
    pathname.startsWith("/submit") ||
    pathname.match(/^\/requests\/[^/]+\/(status|clarify)/)
  ) {
    return NextResponse.next();
  }

  // Protect reviewer paths
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const authCookie = req.cookies.get("auth")?.value;
    const expectedPassword = process.env.AUTH_PASSWORD;

    if (!expectedPassword || authCookie !== expectedPassword) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
