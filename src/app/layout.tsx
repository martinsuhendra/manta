import { ReactNode } from "react";

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { headers } from "next/headers";

import { Providers } from "@/components/providers";
import { APP_CONFIG } from "@/config/app-config";
import { getPreference } from "@/server/server-actions";
import { THEME_MODE_VALUES, type ThemeMode } from "@/types/preferences/theme";

import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const themeMode = await getPreference<ThemeMode>("theme_mode", THEME_MODE_VALUES, "light");
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isShopPage = pathname.startsWith("/shop");
  const htmlDarkClass = isShopPage ? "dark" : themeMode === "dark" ? "dark" : "";

  return (
    <html lang="en" className={htmlDarkClass} suppressHydrationWarning>
      <body className={`${outfit.className} min-h-screen antialiased`}>
        <Providers themeMode={isShopPage ? "dark" : themeMode}>{children}</Providers>
      </body>
    </html>
  );
}
