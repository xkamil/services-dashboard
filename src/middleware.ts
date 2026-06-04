import { getIronSession } from "iron-session";
import { type NextRequest, NextResponse } from "next/server";

import { type SessionData, sessionOptions } from "~/server/auth";

const AUTH_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  );

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPath) {
    if (session.userId) {
      const target = session.isTemporaryPassword ? "/change-password" : "/";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.isTemporaryPassword && !pathname.startsWith("/change-password")) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
