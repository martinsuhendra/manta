import { NextResponse, type NextRequest } from "next/server";

import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Get the JWT token to check authentication and role
  const token = await getToken({ req: request });

  const isLoggedIn = !!token;

  // Check if the user is trying to access a protected route
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  // Check if the user is trying to access auth pages
  const isAuthPage = nextUrl.pathname.startsWith("/sign-in") || nextUrl.pathname.startsWith("/sign-up");

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    const redirectPath = token.role === "SUPERADMIN" ? "/dashboard/home" : "/shop";
    return NextResponse.redirect(new URL(redirectPath, nextUrl));
  }

  // Redirect unauthenticated users to sign-in page
  if (!isLoggedIn && isProtectedRoute) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
