import type { NextAuthConfig } from "next-auth";
import { resolveRouteAccess, isRouteAllowedForUser } from "@/lib/auth/route-access";
import { refreshAccessToken } from "@/lib/auth/token-refresh";

// Cached auth service health check to avoid hitting discovery on every request.
// Result is cached for 15 seconds.
let authHealthCache: { healthy: boolean; checkedAt: number } | null = null;
const AUTH_HEALTH_CACHE_TTL_MS = 15_000;

export async function isAuthServiceHealthy(): Promise<boolean> {
  // Return cached result if fresh
  if (authHealthCache && Date.now() - authHealthCache.checkedAt < AUTH_HEALTH_CACHE_TTL_MS) {
    return authHealthCache.healthy;
  }

  const issuer = process.env.AUTH_ISSUER;
  if (!issuer) {
    authHealthCache = { healthy: false, checkedAt: Date.now() };
    return false;
  }

  try {
    const discoveryUrl = `${issuer}.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    const healthy = response.ok;
    authHealthCache = { healthy, checkedAt: Date.now() };
    return healthy;
  } catch {
    // Fail OPEN on a transient error (timeout / network blip).
    return true;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "authservice",
      name: "Auth Service",
      type: "oidc",
      issuer: process.env.AUTH_ISSUER,
      clientId: process.env.AUTH_CRMS_CLIENT_ID,
      clientSecret: process.env.AUTH_CRMS_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid profile email systems offline_access",
        },
      },
    },
  ],
  pages: {
    signIn: "/signin",
    error: "/auth-unavailable",
  },
  callbacks: {
    async jwt({ token, profile, account }) {
      // On initial sign-in, populate token from account
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.error = undefined;

        const authoritativeSub =
          account.providerAccountId ??
          ((profile as Record<string, unknown> | undefined)?.sub as string | undefined);
        if (authoritativeSub) {
          token.sub = authoritativeSub;
        }
      }

      // Extract user profile claims
      if (profile) {
        const p = profile as Record<string, unknown>;
        const name =
          (p.name as string) ??
          (p.preferred_username as string) ??
          (p.given_name as string) ??
          undefined;
        if (name) token.name = name;
        if (p.email) token.email = p.email as string;

        const username =
          (p.preferred_username as string) ??
          (p.employee_code as string) ??
          (p.employeeCode as string) ??
          (p.employee_id as string) ??
          (p.username as string) ??
          (p.unique_name as string) ??
          (p.nickname as string) ??
          undefined;
        if (username) {
          token.username = username;
        }

        if (profile.systems) {
          token.systems = (profile.systems as string).split(",");
        }
        if (profile.role) {
          token.role = profile.role as string;
        }
        if (profile.isSuperUser) {
          token.isSuperUser = profile.isSuperUser === "true" || profile.isSuperUser === true;
        }
        if (profile.permissions) {
          try {
            const allPerms = typeof profile.permissions === "string"
              ? JSON.parse(profile.permissions)
              : profile.permissions;
            
            token.permissions = { CRMS: allPerms?.CRMS || {} };
          } catch {
            token.permissions = {};
          }
        }
      }

      if (!token.expiresAt) return token;

      if (Date.now() < ((token.expiresAt as number) - 300) * 1000) {
        return token;
      }

      if (token.refreshToken) {
        return await refreshAccessToken(token);
      }

      return { ...token, error: "RefreshAccessTokenError" };
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.systems = (token.systems as string[]) ?? [];
      session.role = (token.role as string) ?? "Staff/Employee";
      session.isSuperUser = (token.isSuperUser as boolean) ?? false;
      session.permissions = token.permissions ?? {};

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (session.user) {
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.username) {
          session.user.username = token.username as string;
        }
      }

      if (token.error) {
        session.error = token.error as string;
      }

      return session;
    },

    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthPath = pathname.startsWith("/api/auth");
      const isProxyPath = pathname.startsWith("/api/crm") || pathname.startsWith("/hubs/");
      const isSignInPage = pathname === "/signin";
      const isAccessDeniedPage = pathname === "/access-denied";
      const isAuthUnavailablePage = pathname === "/auth-unavailable";

      if (isAuthPath || isAuthUnavailablePage) {
        return true;
      }

      const isPageRequest = !isProxyPath && !pathname.startsWith("/api/");
      if (isPageRequest && !isSignInPage && !isAccessDeniedPage && !auth?.user) {
        const reachable = await isAuthServiceHealthy();
        if (!reachable) {
          return Response.redirect(new URL("/auth-unavailable", request.nextUrl));
        }
      }

      if (auth?.user) {
        if (auth.error === "RefreshAccessTokenError") {
          if (isSignInPage || isAuthUnavailablePage) return true;
          return false;
        }

        const systems = auth.systems || [];
        const hasCrmsAccess = systems.includes("CRMS");

        if (!hasCrmsAccess) {
          if (isAccessDeniedPage) return true;
          return Response.redirect(new URL("/access-denied", request.nextUrl));
        }

        if (auth.isSuperUser) {
          if (isSignInPage || isAccessDeniedPage) {
            return Response.redirect(new URL("/", request.nextUrl));
          }
          return true;
        }

        const routeRule = resolveRouteAccess(pathname);
        const crmsPerms = auth.permissions?.CRMS as
          | Record<string, { canRead?: boolean } | undefined>
          | undefined;
        if (!isRouteAllowedForUser(routeRule, crmsPerms)) {
          if (isAccessDeniedPage) return true;
          return Response.redirect(new URL("/access-denied", request.nextUrl));
        }

        if (isSignInPage || isAccessDeniedPage) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      if (isSignInPage || isAccessDeniedPage) {
        return true;
      }

      if (isProxyPath) {
        return Response.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        );
      }

      return false;
    },
  },
};
