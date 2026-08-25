import NextAuth from "next-auth";

// Module-level cache for in-flight token refresh promises.
// Keyed by refresh token string, entries expire after 30 seconds.
const refreshCache = new Map<string, { promise: Promise<any>; expiresAt: number }>();

const REFRESH_CACHE_TTL_MS = 30_000; // 30 seconds
const TOKEN_REFRESH_TIMEOUT_MS = 10_000; // 10 second timeout for token refresh calls

async function refreshAccessToken(token: any) {
  const refreshToken = token.refreshToken as string;

  if (!refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  // Check if there's already an in-flight or recently-resolved refresh for this token
  const cached = refreshCache.get(refreshToken);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.promise;
  }

  // Create the refresh promise and cache it
  const refreshPromise = doRefreshAccessToken(token);
  refreshCache.set(refreshToken, {
    promise: refreshPromise,
    expiresAt: Date.now() + REFRESH_CACHE_TTL_MS,
  });

  // Clean up the cache entry after TTL expires
  refreshPromise.finally(() => {
    setTimeout(() => {
      const entry = refreshCache.get(refreshToken);
      if (entry && entry.promise === refreshPromise) {
        refreshCache.delete(refreshToken);
      }
    }, REFRESH_CACHE_TTL_MS);
  });

  return refreshPromise;
}

async function doRefreshAccessToken(token: any) {
  try {
    const url = `${process.env.AUTH_ISSUER}/connect/token`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AUTH_CRMS_CLIENT_ID!,
        client_secret: process.env.AUTH_CRMS_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
      signal: AbortSignal.timeout(TOKEN_REFRESH_TIMEOUT_MS),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      // Clear any previous error
      error: undefined,
    };
  } catch (error) {
    console.error("[auth] Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}


// Cached auth service health check to avoid hitting discovery on every request.
// Result is cached for 15 seconds.
let authHealthCache: { healthy: boolean; checkedAt: number } | null = null;
const AUTH_HEALTH_CACHE_TTL_MS = 15_000;

async function isAuthServiceHealthy(): Promise<boolean> {
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
    authHealthCache = { healthy: false, checkedAt: Date.now() };
    return false;
  }
}


export const { handlers, signIn, signOut, auth } = NextAuth({
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
      }

      // Extract user profile claims
      if (profile) {
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
            
            // Only store CRMS permissions to avoid 431 Request Header Fields Too Large 
            // caused by the NextAuth session cookie exceeding browser/Node limits.
            token.permissions = { CRMS: allPerms?.CRMS || {} };
          } catch {
            token.permissions = {};
          }
        }
      }

      // If there is no expiration (e.g. no token yet), just return
      if (!token.expiresAt) return token;

      // Return previous token if the access token has not expired yet
      // We buffer by 5 minutes (300 seconds) to refresh proactively
      if (Date.now() < ((token.expiresAt as number) - 300) * 1000) {
        return token;
      }

      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        return await refreshAccessToken(token);
      }

      // No refresh token available — mark as error
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

      // Propagate token error to session so client can react (e.g., force re-login)
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

      // Always allow access to auth routes, signin page, and error pages
      if (isAuthPath || isAuthUnavailablePage) {
        return true;
      }

      // For page navigations (not API/proxy), verify auth service is reachable.
      // Uses cached result to avoid checking on every single request.
      const isPageRequest = !isProxyPath && !pathname.startsWith("/api/");
      if (isPageRequest && !isSignInPage && !isAccessDeniedPage) {
        const reachable = await isAuthServiceHealthy();
        if (!reachable) {
          return Response.redirect(new URL("/auth-unavailable", request.nextUrl));
        }
      }

      // Authenticated users
      if (auth?.user) {
        // If token refresh failed, force re-authentication
        if (auth.error === "RefreshAccessTokenError") {
          if (isSignInPage || isAuthUnavailablePage) return true;
          return false; // Will redirect to signin, which checks auth health
        }

        // Enforce global system permission
        const systems = auth.systems || [];
        const hasCrmsAccess = systems.includes("CRMS");

        if (!hasCrmsAccess) {
          if (isAccessDeniedPage) return true;
          return Response.redirect(new URL("/access-denied", request.nextUrl));
        }

        // Bypass permission checks for Super Admin/CEO
        if (auth.isSuperUser) {
          if (isSignInPage || isAccessDeniedPage) {
            return Response.redirect(new URL("/", request.nextUrl));
          }
          return true;
        }

        // Enforce module-level permission
        let requiredModule: string | null = null;
        if (pathname === "/" || pathname.startsWith("/dashboard")) {
          requiredModule = "Dashboard";
        } else if (pathname.startsWith("/customers")) {
          requiredModule = "Customer Profiles";
        } else if (pathname.startsWith("/conversations")) {
          requiredModule = "Conversations";
        } else if (pathname.startsWith("/tickets")) {
          requiredModule = "Tickets";
        } else if (pathname.startsWith("/campaigns")) {
          requiredModule = "Campaigns";
        } else if (pathname.startsWith("/settings")) {
          // Settings is SuperAdmin/CEO only — non-super users get denied
          if (isAccessDeniedPage) return true;
          return Response.redirect(new URL("/access-denied", request.nextUrl));
        }

        if (requiredModule) {
          const crmsPerms = auth.permissions?.CRMS;
          const hasModuleAccess = crmsPerms?.[requiredModule]?.canRead;
          if (!hasModuleAccess) {
            if (isAccessDeniedPage) return true;
            return Response.redirect(new URL("/access-denied", request.nextUrl));
          }
        }

        // Authenticated users shouldn't see signin/access-denied
        if (isSignInPage || isAccessDeniedPage) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      // --- Unauthenticated users ---

      // Allow signin and access-denied pages
      if (isSignInPage || isAccessDeniedPage) {
        return true;
      }

      // Proxy paths (API routes called by the frontend) should return 401 not redirect
      if (isProxyPath) {
        return Response.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        );
      }

      // All other routes — redirect to signin
      return false;
    },
  },
});
