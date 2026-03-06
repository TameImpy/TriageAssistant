import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/api/triage", "/api/agents"];
const PUBLIC_API_PATHS = ["/api/auth", "/api/intake", "/api/requests"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public API paths (includes POST /api/requests for employee submissions)
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    // Only protect GET /api/requests list and GET /api/requests/[id] for reviewers
    if (pathname === "/api/requests" && req.method === "GET") {
      return requireAuth(req);
    }
    if (pathname.match(/^\/api\/requests\/[^/]+$/) && req.method === "GET") {
      return requireAuth(req);
    }
    return NextResponse.next();
  }

  // Fine-grained catalogue API auth
  if (pathname.startsWith("/api/catalogue")) {
    // Public: GET active tools list
    if (pathname === "/api/catalogue" && req.method === "GET") {
      return NextResponse.next();
    }
    // Public: employee submit a catalogue request
    if (pathname === "/api/catalogue/requests" && req.method === "POST") {
      return NextResponse.next();
    }
    // Public: employee check their own catalogue request status
    if (pathname.match(/^\/api\/catalogue\/requests\/[^/]+$/) && req.method === "GET") {
      return NextResponse.next();
    }
    // Everything else (reviewer list, PATCH, tools CRUD) requires auth
    return requireAuth(req);
  }

  // Allow employee-facing pages
  if (
    pathname === "/" ||
    pathname.startsWith("/submit") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/catalogue") ||
    pathname.match(/^\/requests\/[^/]+\/(status|clarify)/)
  ) {
    return NextResponse.next();
  }

  // Protect reviewer pages and remaining API routes
  if (
    pathname.startsWith("/requests") ||
    PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return requireAuth(req);
  }

  return NextResponse.next();
}

function requireAuth(req: NextRequest) {
  const authCookie = req.cookies.get("auth")?.value;
  const expectedPassword = process.env.AUTH_PASSWORD;

  if (!expectedPassword || authCookie !== expectedPassword) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
