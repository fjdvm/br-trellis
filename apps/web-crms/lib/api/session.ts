import { cache } from "react";
import { auth } from "@/auth";

/**
 * Cached session helper. React's cache() deduplicates calls within a single
 * server-side request rendering pass, so multiple components or API clients
 * calling getSession() in the same request will only invoke auth() once.
 */
export const getSession = cache(async () => {
  return await auth();
});

/**
 * Returns just the access token string from the session.
 * Deduplicates via getSession(), so repeated calls in a single request are free.
 */
export const getAccessToken = cache(async (): Promise<string | undefined> => {
  const session = await getSession();
  return session?.accessToken;
});
