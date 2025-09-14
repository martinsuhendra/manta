/**
 * Prisma client singleton.
 *
 * This file is generated manually so that any part of the codebase can import
 * `prisma` or `PrismaClient` from **one** place without worrying about the
 * “multiple PrismaClient instances” warning during development or serverless
 * cold-starts.
 *
 *   import { prisma, PrismaClient } from "@/lib/generated/prisma"
 */

import { PrismaClient as BasePrismaClient } from "@prisma/client";

declare global {
  // Allow the `prisma` object to survive Hot Module Replacement in dev.

  var prisma: BasePrismaClient | undefined;
}

const prisma =
  global.prisma ??
  new BasePrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

// Store the instance in the global scope in development to avoid
// creating new clients on every HMR reload.
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// ─────────────────────────────────────────────────────────────────────────────

export { prisma }; // the ready-to-use singleton
export { BasePrismaClient as PrismaClient }; // named export requested by build
export default prisma;
