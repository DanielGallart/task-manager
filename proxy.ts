import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Comprobación optimista: solo mira si existe la cookie de sesión, sin ir a la BD.
// La validación real de la sesión debe hacerse en cada página/Server Action
// con `auth.api.getSession({ headers: await headers() })`.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/orgs/:path*"],
};
