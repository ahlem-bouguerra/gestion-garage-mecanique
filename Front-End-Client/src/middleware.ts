import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
<<<<<<< HEAD
  const token = req.cookies.get("token")?.value; // lire le cookie

  const publicPaths = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password"];

  if (!token && !publicPaths.includes(req.nextUrl.pathname)) {
=======
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Chemins publics
  const publicPaths = [
    "/", 
    "/landing",
    "/auth/sign-in", 
    "/auth/sign-up", 
    "/auth/forgot-password", 
    "/auth/reset-password",
    "/recherche-global",
  ];

  // Laisser passer si c'est un chemin public
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Rediriger si pas de token
  if (!token) {
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
<<<<<<< HEAD
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
=======
  matcher: [
    /*
     * Applique le middleware uniquement aux pages
     * Exclut automatiquement : api, _next, fichiers statiques, fichiers avec extensions
     */
    '/((?!api|_next|images|videos|fonts|favicon.ico|.*\\..*).*)',
  ],
};
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)
