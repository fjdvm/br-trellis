import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AuthResponse } from "@/types/auth";
import { apiClient } from "@/lib/api/api-client";

/**
 * Refresh the access token using the backend's /auth/refresh endpoint.
 * Returns the new token data or throws if refresh fails.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
}> {
  const res = await apiClient.post<AuthResponse>("/auth/refresh", {
    refreshToken,
  });

  return {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    // Set expiry to 55 minutes from now (backend issues 60-min tokens,
    // refresh 5 minutes early to avoid edge-case expiration during a request)
    accessTokenExpiry: Date.now() + 55 * 60 * 1000,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await apiClient.post<AuthResponse>("/auth/login", {
            email: credentials.email,
            password: credentials.password,
          });

          if (res?.accessToken) {
            return {
              id: res.user.id,
              name: res.user.fullName,
              email: res.user.email,
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
            };
          }
        } catch {
          return null;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days — matches refresh token lifetime
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in — store tokens and set expiry
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        // Backend token is valid for 60 min; refresh 5 min early
        token.accessTokenExpiry = Date.now() + 55 * 60 * 1000;
        token.error = undefined;
        return token;
      }

      // Subsequent requests — check if access token is still valid
      const expiry = token.accessTokenExpiry as number | undefined;
      if (expiry && Date.now() < expiry) {
        // Token still valid, return as-is
        return token;
      }

      // Access token has expired (or is about to) — refresh it
      try {
        const refreshed = await refreshAccessToken(token.refreshToken as string);
        token.accessToken = refreshed.accessToken;
        token.refreshToken = refreshed.refreshToken;
        token.accessTokenExpiry = refreshed.accessTokenExpiry;
        token.error = undefined;
      } catch {
        // Refresh failed — mark the session as errored so the client can sign out
        token.error = "RefreshTokenExpired";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      session.accessToken = (token.accessToken as string) || "";
      session.error = token.error as string | undefined;
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      // Allow static assets, images, next internals, and API auth endpoints
      const isStaticAsset =
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname === "/favicon.ico" ||
        /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/i.test(pathname);

      if (isStaticAsset) {
        return true;
      }

      const authGuestOnlyPaths = ["/signin", "/signup", "/forgot-password", "/reset-password"];
      const isAuthGuestOnlyPath = authGuestOnlyPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

      const publicPaths = ["/", "/products", "/catalog", "/about", "/contact", "/terms", "/privacy", "/returns", "/faq", "/careers", "/support", "/verify-email"];
      const isPublicPath = publicPaths.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));

      if (auth?.user && isAuthGuestOnlyPath) {
        return Response.redirect(new URL("/", request.url));
      }

      if (isPublicPath || isAuthGuestOnlyPath) {
        return true;
      }

      return !!auth?.user;
    },
  },
});
