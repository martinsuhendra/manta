/**
 * Global Next-Auth configuration & helpers
 *
 *  • `handlers` – { GET, POST } route handlers for `/api/auth/[...nextauth]`
 *  • `auth`      – `auth()` helper you can call in Server Components / Actions
 *  • `signIn`    – `signIn()` helper (client & server)
 *  • `signOut`   – `signOut()` helper (client & server)
 */
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/generated/prisma";
import { signInFormSchema } from "@/lib/validators";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@acme.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        if (!raw) return null;

        const { email, password } = signInFormSchema.parse(raw);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneNo: user.phoneNo,
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    newUser: "/sign-up",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If url is a relative path, make it absolute
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If url is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) return url;
      // Otherwise redirect to dashboard home
      return `${baseUrl}/dashboard/home`;
    },
    async jwt({ token, user, trigger }: { token: JWT; user?: User; trigger?: "update" | "signIn" | "signUp" }) {
      if (user) {
        token.role = (user as User & { role: string }).role;
        token.emailVerified = (user as User & { emailVerified: Date | null }).emailVerified;
        token.phoneNo = (user as User & { phoneNo: string | null }).phoneNo;
      }

      if (trigger === "update") {
        const refreshedUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { emailVerified: true, role: true, phoneNo: true },
        });
        if (refreshedUser) {
          token.emailVerified = refreshedUser.emailVerified;
          token.role = refreshedUser.role;
          token.phoneNo = refreshedUser.phoneNo;
        }
      }

      return token;
    },
    async session({ session, token }: { session: { user: User; expires: string }; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.phoneNo = token.phoneNo as string | null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

// Create auth function for server-side session access
export function auth() {
  return getServerSession(authOptions);
}

// Export handlers for the API route
export const handlers = NextAuth(authOptions);

// Client-side auth functions
export { signIn, signOut } from "next-auth/react";
