import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Use the auth middleware directly so the `authorized` callback in authConfig
// performs the redirect. (Wrapping it in a custom function would bypass that gate.)
export default NextAuth(authConfig).auth;

export const config = {
  // Guard pages only. All /api routes self-guard inside their handlers (so the
  // public demo landing can still fetch demo stats while logged out).
  matcher: ["/((?!api|script.js|_next/static|_next/image|favicon.ico|logo.png).*)"],
};
