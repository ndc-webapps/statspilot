import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Cloudflare OpenNext currently supports Edge Middleware, while Next 16 Proxy
// runs on Node.js. Keep this file as middleware until Cloudflare supports Node Proxy.
export default NextAuth(authConfig).auth;

export const config = {
  // Guard pages only. All /api routes self-guard inside their handlers (so the
  // public demo landing can still fetch demo stats while logged out).
  matcher: ["/((?!api|script.js|_next/static|_next/image|favicon.ico|logo.png).*)"],
};
