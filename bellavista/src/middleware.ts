// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt"; // <--- Use NextAuth's getToken

// JWT_SECRET_STRING_FROM_ENV is still needed for getToken
const JWT_SECRET_STRING_FROM_ENV = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET_STRING_FROM_ENV) {
  console.error(
    "MIDDLEWARE FATAL ERROR: NEXTAUTH_SECRET environment variable is not set..."
  );
}

interface UserPayloadFromNextAuthToken {
  // Structure of the token as populated by your jwt callback
  id?: string;
  role?: "CLIENT" | "AGENT" | "ADMIN";
  name?: string;
  email?: string;
  picture?: string;
  sub?: string; // NextAuth usually puts user ID here
  iat?: number;
  exp?: number;
  jti?: string;
  // Add any other custom fields you put in the JWT callback
}

async function getUserFromNextAuthToken(
  request: NextRequest
): Promise<UserPayloadFromNextAuthToken | null> {
  try {
    const token = await getToken({
      req: request,
      secret: JWT_SECRET_STRING_FROM_ENV,
      // raw: true, // If you wanted the raw JWT string, but we want the decoded payload
      // You can specify custom cookie names here if you changed them in NextAuth options
      // cookieName: 'custom-session-cookie',
      // secureCookie: request.nextUrl.protocol === 'https:',
    });

    if (
      token &&
      typeof token.role === "string" &&
      (typeof token.id === "string" || typeof token.sub === "string")
    ) {
      // Map NextAuth token structure to your expected UserPayload
      // NextAuth's getToken returns a payload that directly includes what you put in the jwt callback
      return {
        id: token.id || token.sub, // Prefer your custom 'id', fallback to 'sub'
        role: token.role as "CLIENT" | "AGENT" | "ADMIN",
        name: token.name,
        email: token.email,
        iat: token.iat,
        exp: token.exp,
        jti: token.jti,
        sub: token.sub,
      };
    } else if (token) {
      console.warn(
        "MIDDLEWARE: Token decoded by getToken, but 'role' or 'id'/'sub' is missing/invalid:",
        token
      );
      return null;
    }
    return null;
  } catch (error) {
    console.error(
      "MIDDLEWARE: getUserFromNextAuthToken - Error with NextAuth getToken:",
      error
    );
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!JWT_SECRET_STRING_FROM_ENV) {
    // ... (your existing fatal error handling for missing secret) ...
    const protectedBasePathsNoSecret = ["/client", "/agent", "/admin"];
    if (
      protectedBasePathsNoSecret.some((basePath) =>
        pathname.startsWith(basePath)
      )
    ) {
      console.error("MIDDLEWARE HALT: NEXTAUTH_SECRET not available.");
      return NextResponse.redirect(
        new URL("/auth/login?error=server_config_error_secret", request.url)
      );
    }
    return NextResponse.next();
  }

  // Use NextAuth's getToken to correctly decrypt and verify its own JWE token
  const user = await getUserFromNextAuthToken(request);

  // The rest of your middleware logic remains largely the same,
  // using the 'user' object returned by getUserFromNextAuthToken.

  const isSecure = request.nextUrl.protocol === "https:"; // Still useful for constructing cookie names if needed
  const cookiePrefix = isSecure ? "__Secure-" : "";
  const sessionCookieName = `${cookiePrefix}next-auth.session-token`; // For potential manual deletion if needed

  if (user && user.role) {
    // user object is now the decoded payload
    if (
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/signup")
    ) {
      if (user.role === "CLIENT")
        return NextResponse.redirect(new URL("/client/dashboard", request.url));
      if (user.role === "AGENT")
        return NextResponse.redirect(new URL("/agent/dashboard", request.url));
      if (user.role === "ADMIN")
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/") {
      if (user.role === "CLIENT")
        return NextResponse.redirect(new URL("/client/dashboard", request.url));
      if (user.role === "AGENT")
        return NextResponse.redirect(new URL("/agent/dashboard", request.url));
      if (user.role === "ADMIN")
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      return NextResponse.next();
    }

    // Route Protection
    if (pathname.startsWith("/client") && user.role !== "CLIENT") {
      return NextResponse.redirect(
        new URL("/auth/login?error=unauthorized", request.url)
      );
    }
    // ... (other role protections) ...
    return NextResponse.next();
  } else if (request.cookies.has(sessionCookieName) && !user) {
    // Cookie exists, but getToken failed (invalid/expired)

    if (!pathname.startsWith("/auth/login")) {
      const response = NextResponse.redirect(
        new URL("/auth/login?error=session_invalid_or_expired", request.url)
      );
      response.cookies.delete(sessionCookieName);
      response.cookies.delete(`${cookiePrefix}next-auth.csrf-token`);
      response.cookies.delete(`${cookiePrefix}next-auth.callback-url`);
      return response;
    }
  }

  // User is NOT authenticated (no valid token or getToken failed)
  const protectedBasePaths = ["/client", "/agent", "/admin"];
  if (
    !user &&
    protectedBasePaths.some((basePath) => pathname.startsWith(basePath)) &&
    !pathname.startsWith("/auth/")
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)", "/"],
};
