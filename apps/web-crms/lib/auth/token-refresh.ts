// Module-level cache for in-flight token refresh promises.
// Keyed by refresh token string, entries expire after 30 seconds.
const refreshCache = new Map<string, { promise: Promise<any>; expiresAt: number }>();

const REFRESH_CACHE_TTL_MS = 30_000; // 30 seconds
const TOKEN_REFRESH_TIMEOUT_MS = 10_000; // 10 second timeout for token refresh calls

export async function refreshAccessToken(token: any) {
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
