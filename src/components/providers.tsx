"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TRPCReactProvider } from "@/trpc/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <TRPCReactProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthQueryProvider>
          <AuthUIProviderTanstack
            authClient={authClient}
            navigate={router.push}
            replace={router.replace}
            persistClient={false}
            onSessionChange={() => router.refresh()}
            Link={Link}
          >
            {children}
            <Toaster richColors />
          </AuthUIProviderTanstack>
        </AuthQueryProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </TRPCReactProvider>
  );
}
