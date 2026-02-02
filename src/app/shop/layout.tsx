import React from "react";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";

import { ShopHeaderWrapper } from "./_components/shop-header-wrapper";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <ShopHeaderWrapper session={session} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 bg-slate-950 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold">{APP_CONFIG.name}</h3>
              <p className="text-muted-foreground mt-2 text-sm">Forging elite fitness since 2026.</p>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">
                Terms
              </a>
              <a href="#" className="hover:text-white">
                Privacy
              </a>
              <a href="#" className="hover:text-white">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>{APP_CONFIG.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
