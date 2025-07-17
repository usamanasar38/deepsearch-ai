import { headers } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import Chat from "@/components/ai/chat";
import Header from "@/components/header";
import { ThreadsSidebar } from "@/components/threads-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchSession } from "@daveyplate/better-auth-tanstack/server";
import { auth } from "@/server/auth";

export default async function Home() {
  const queryClient = getQueryClient();
  const { data, session, user } = await prefetchSession(
    auth,
    queryClient,
    {
      headers: await headers(),
    },
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <ThreadsSidebar />
        <SidebarInset>
          <div className="flex min-h-svh flex-col">
            <Header />
            <div className="relative flex h-[calc(100dvh-64px)] flex-col">
              <Chat />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
