import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
export { refreshAccessToken } from "@/lib/auth/token-refresh";
export { isAuthServiceHealthy } from "@/lib/auth/config";
