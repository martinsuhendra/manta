import { createStore } from "zustand/vanilla";

export interface BrandState {
  activeBrandId: string | "ALL";
  brands: BrandSummary[];
  setActiveBrand: (id: string | "ALL") => void;
  setBrands: (brands: BrandSummary[]) => void;
}

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  primaryColor?: string;
  accentColor?: string;
  isActive?: boolean;
}

export function createBrandStore(init?: Partial<BrandState>) {
  return createStore<BrandState>()((set) => ({
    activeBrandId: init?.activeBrandId ?? "ALL",
    brands: init?.brands ?? [],
    setActiveBrand: (id) => set({ activeBrandId: id }),
    setBrands: (brands) => set({ brands }),
  }));
}
