"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AuthProvider } from "@/components/auth-provider";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";
import { ThemeMode } from "@/types/preferences/theme";

export function Providers({ children, themeMode }: { children: React.ReactNode; themeMode: ThemeMode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesStoreProvider themeMode={themeMode}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors />
      </PreferencesStoreProvider>
    </QueryClientProvider>
  );
}
