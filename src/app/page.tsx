import { headers } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import Chat from "@/components/ai/chat";
import Header from "@/components/header";
import { ThreadsSidebar } from "@/components/threads-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchSession } from "@daveyplate/better-auth-tanstack/server";
import { auth } from "@/server/auth";
import {
  getThreadQueryOptions,
  getThreadsQueryOptions,
} from "@/hooks/use-threads";

export default async function Home({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const queryClient = getQueryClient();
  const { data, session, user } = await prefetchSession(auth, queryClient, {
    headers: await headers(),
  });
  const promises: Promise<unknown>[] = [];
  if (session?.userId) {
    promises.push(
      queryClient.prefetchQuery({
        ...getThreadsQueryOptions(),
      }),
    );
  }

  if (session?.userAgent && threadId) {
    promises.push(
      queryClient.prefetchQuery({
        ...getThreadQueryOptions(threadId),
      }),
    );
  }

  await Promise.all(promises);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <ThreadsSidebar />
        <SidebarInset>
          <div className="flex min-h-svh flex-col">
            <Header />
            <div className="relative flex h-[calc(100dvh-64px)] flex-col">
              <Chat threadId={threadId} />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
