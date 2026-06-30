import type { Session } from "next-auth";
import { getSession } from "next-auth/react";

import { shouldRedirectToDashboardAfterAuth } from "@/lib/rbac";

interface WaitForSessionOptions {
  maxAttempts?: number;
  delayMs?: number;
}

export const DASHBOARD_HOME_PATH = "/dashboard/home";
export const PUBLIC_HOME_PATH = "/public";

export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return false;
  return true;
}

export function isDashboardPath(path: string): boolean {
  return path === "/dashboard" || path.startsWith("/dashboard/");
}

export function normalizeDashboardCallbackPath(path: string): string {
  if (path === "/dashboard" || path === "/dashboard/") return DASHBOARD_HOME_PATH;
  return path;
}

export function getPostAuthRedirectPath(role: string | undefined, callbackUrl?: string | null) {
  const shouldUseDashboard = shouldRedirectToDashboardAfterAuth(role);

  if (!shouldUseDashboard) {
    return PUBLIC_HOME_PATH;
  }

  if (isSafeInternalPath(callbackUrl) && isDashboardPath(callbackUrl)) {
    return normalizeDashboardCallbackPath(callbackUrl);
  }

  return DASHBOARD_HOME_PATH;
}

export async function waitForAuthenticatedSession(options: WaitForSessionOptions = {}): Promise<Session | null> {
  const { maxAttempts = 15, delayMs = 50 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const session = await getSession();
    if (session?.user.role) return session;

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return getSession();
}
