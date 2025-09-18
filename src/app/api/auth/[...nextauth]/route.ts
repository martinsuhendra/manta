import NextAuth from "next-auth/next";

import { authOptions } from "@/auth";

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;
