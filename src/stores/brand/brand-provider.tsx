"use client";

import { createContext, useContext, useEffect, useRef } from "react";

import axios from "axios";
import { useStore, type StoreApi } from "zustand";

import { createBrandStore, type BrandState } from "./brand-store";

interface BrandStoreProviderProps {
  children: React.ReactNode;
  initialActiveBrandId?: string | "ALL";
  initialBrands?: BrandState["brands"];
}

const BrandStoreContext = createContext<StoreApi<BrandState> | null>(null);

export function BrandStoreProvider({ children, initialActiveBrandId, initialBrands }: BrandStoreProviderProps) {
  const storeRef = useRef<StoreApi<BrandState> | null>(null);

  storeRef.current ??= createBrandStore({
    activeBrandId: initialActiveBrandId ?? "ALL",
    brands: initialBrands ?? [],
  });

  // Keep cookie in sync on client whenever activeBrandId changes (subscribe so we don't need useBrandStore inside provider)
  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    const setCookie = () => {
      const id = store.getState().activeBrandId;
      document.cookie = `active_brand_id=${encodeURIComponent(id)}; path=/`;
    };
    setCookie();
    const unsub = store.subscribe(setCookie);
    return () => unsub();
  }, []);

  // Attach X-Brand-Id header to every axios request from current store state
  useEffect(() => {
    const interceptorId = axios.interceptors.request.use((config) => {
      const store = storeRef.current;
      if (!store) return config;
      const id = store.getState().activeBrandId;
      if (id && id !== "ALL") {
        config.headers.set("X-Brand-Id", id);
      }
      return config;
    });
    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, []);

  return <BrandStoreContext.Provider value={storeRef.current}>{children}</BrandStoreContext.Provider>;
}

export function useBrandStore<T>(selector: (state: BrandState) => T): T {
  const store = useContext(BrandStoreContext);
  if (!store) throw new Error("Missing BrandStoreProvider");
  return useStore(store, selector);
}
