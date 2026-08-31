import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "authservice",
      name: "Auth Service",
      type: "oidc",
      issuer: process.env.AUTH_ISSUER,
      clientId: process.env.AUTH_HRMS_CLIENT_ID,
      clientSecret: process.env.AUTH_HRMS_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid profile email systems",
        },
      },
    },
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.systems) {
        token.systems = (profile.systems as string).split(",");
      }
      return token;
    },
    async session({ session, token }) {
      session.systems = (token.systems as string[]) ?? [];
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthPath = pathname.startsWith("/api/auth");
      const isSignInPage = pathname === "/signin";

      if (auth?.user && (isAuthPath || isSignInPage)) {
        return Response.redirect(new URL("http://localhost:3005/"));
      }

      if (!auth?.user && !isAuthPath && !isSignInPage) {
        return false;
      }

      return true;
    },
  },
});
