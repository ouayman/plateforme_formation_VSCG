import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

const protectedPaths = [
  "/dashboard",
  "/projects",
  "/trainings",
  "/sessions",
  "/planning",
  "/my-trainings",
  "/mes-formations",
  "/admin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Full JWT verification runs in server components (getSession).
  // Edge middleware may not always have the same env/runtime as Node.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/trainings/:path*",
    "/sessions/:path*",
    "/planning/:path*",
    "/my-trainings/:path*",
    "/mes-formations/:path*",
    "/admin/:path*",
  ],
};
