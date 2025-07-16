"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { getQueryClient } from "@/lib/get-query-client";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
