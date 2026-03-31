"use client";

import { useEffect } from "react";

import { useBrandStore } from "@/stores/brand/brand-provider";

const DEFAULT_PRIMARY = "#6366f1";
const DEFAULT_ACCENT = "#8b5cf6";

export function BrandThemeInjector() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const brands = useBrandStore((s) => s.brands);

  useEffect(() => {
    const root = document.documentElement;
    if (activeBrandId && activeBrandId !== "ALL") {
      const brand = brands.find((b) => b.id === activeBrandId);
      root.style.setProperty("--brand-primary", brand?.primaryColor ?? DEFAULT_PRIMARY);
      root.style.setProperty("--brand-accent", brand?.accentColor ?? DEFAULT_ACCENT);
    } else {
      root.style.setProperty("--brand-primary", DEFAULT_PRIMARY);
      root.style.setProperty("--brand-accent", DEFAULT_ACCENT);
    }
  }, [activeBrandId, brands]);

  return null;
}
