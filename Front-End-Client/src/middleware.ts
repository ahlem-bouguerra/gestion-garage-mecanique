import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value; // lire le cookie

  const publicPaths = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password"];

  if (!token && !publicPaths.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
