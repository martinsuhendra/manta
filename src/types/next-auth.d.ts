import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    emailVerified?: Date | null;
    phoneNo?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      emailVerified?: Date | null;
      phoneNo?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    emailVerified?: Date | null;
    phoneNo?: string | null;
  }
}
