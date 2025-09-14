import { ReactNode } from "react";

import type { Metadata } from "next";
import { Outfit } from "next/font/google";

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

  return (
    <html lang="en" className={themeMode === "dark" ? "dark" : ""} suppressHydrationWarning>
      <body className={`${outfit.className} min-h-screen antialiased`}>
        <Providers themeMode={themeMode}>{children}</Providers>
      </body>
    </html>
  );
}
