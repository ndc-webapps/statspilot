import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no DB, no bcrypt).
 * Used by middleware for route protection and shared by the full config in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isAuthPage = path === "/login" || path === "/register";

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Public demo landing — anyone can view it (it only ever shows demo data).
      if (path === "/") return true;

      // Everything else (settings, project pages, add project) requires login.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
