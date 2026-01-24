import { MIDTRANS_CONFIG } from "./config";

/**
 * Create Basic Authorization header for Midtrans API
 */
export function createAuthHeader(): string {
  return Buffer.from(`${MIDTRANS_CONFIG.serverKey}:`).toString("base64");
}

/**
 * Make authenticated request to Midtrans API
 */
export async function midtransFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${createAuthHeader()}`,
      ...options.headers,
    },
  });
}

/**
 * Parse JSON response safely
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();

  if (!responseText) {
    throw new Error("Empty response from API");
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
  }
}

/**
 * Serialize data for Prisma JSON fields
 */
export function serializeForPrisma<T extends Record<string, unknown>>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}
