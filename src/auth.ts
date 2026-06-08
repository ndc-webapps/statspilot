import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

function ipFromRequest(req: Request | undefined): string {
  if (!req) return "unknown";
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Google is only enabled when its credentials are configured, so a missing key
// never breaks the app — the button just won't be offered (see googleEnabled).
export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: NextAuthConfig["providers"] = [];

if (googleEnabled) {
  providers.push(Google);
}

providers.push(
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw, request) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success || !prisma) return null;

      const { email, password } = parsed.data;

      // Throttle password attempts per IP to slow brute force.
      if (isRateLimited(`login:${ipFromRequest(request)}`, 10)) return null;

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

      // No account, or an OAuth-only account (no password set) — reject password login.
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name };
    },
  })
);

function fallbackOAuthUserId(email: string) {
  return `google:${email.toLowerCase()}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    // Only accept Google logins whose email Google itself has verified.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return Boolean(profile?.email) && (profile as { email_verified?: boolean })?.email_verified === true;
      }
      return true;
    },
    // Resolve the database user id into the JWT. Runs in the Node auth route on
    // sign-in (when `account` is present); subsequent edge calls keep token.id.
    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user?.id) {
        token.id = user.id;
        return token;
      }

      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase();
        token.id = fallbackOAuthUserId(email);

        if (prisma) {
          try {
            const dbUser = await prisma.user.upsert({
              where: { email },
              update: { name: user.name ?? undefined, image: user.image ?? undefined },
              create: {
                email,
                name: user.name ?? null,
                image: user.image ?? null,
                passwordHash: null,
              },
            });
            token.id = dbUser.id;
          } catch (error) {
            console.error("Google sign-in could not persist the user. Falling back to demo-only session.", error);
          }
        }
      }

      return token;
    },
  },
});
