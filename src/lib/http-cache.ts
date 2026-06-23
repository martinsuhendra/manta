import { unstable_cache } from "next/cache";

export const PUBLIC_CACHE_SECONDS = 60;

export function publicCacheHeaders() {
  return {
    "Cache-Control": `public, s-maxage=${PUBLIC_CACHE_SECONDS}, stale-while-revalidate=120`,
  };
}

export function createPublicCache<TArgs extends unknown[], TResult>(
  keyParts: string[],
  fn: (...args: TArgs) => Promise<TResult>,
  revalidate = PUBLIC_CACHE_SECONDS,
) {
  return unstable_cache(fn, keyParts, { revalidate });
}
