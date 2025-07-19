import { headers } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import Chat from "@/components/ai/chat";
import Header from "@/components/header";
import { ThreadsSidebar } from "@/components/threads-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prefetchSession } from "@daveyplate/better-auth-tanstack/server";
import { auth } from "@/server/auth";
import { getQueryClient } from "@/trpc/query-client";
import { getThread } from "@/server/db/queries";
import { Message, UIMessage } from "ai";
import { api } from "@/trpc/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: chatIdFromUrl } = await searchParams;
  const queryClient = getQueryClient();
  const { session } = await prefetchSession(auth, queryClient, {
    headers: await headers(),
  });
  const promises: Promise<unknown>[] = [];
  if (session?.userId) {
    promises.push(
      api.threads.getThreads.prefetch(),
    );
  }

  // Fetch chats if user is authenticated
  const activeThread =
    chatIdFromUrl && session?.userId
      ? await getThread({
          userId: session?.userId,
          threadId: chatIdFromUrl,
        })
      : null;

  const initialMessages =
    (activeThread?.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as Message["role"],
      parts: msg.content as Message["parts"],
      content: "",
    })) ?? []) as UIMessage[];

  await Promise.all(promises);

  // Generate a stable chatId if none exists
	const threadId = chatIdFromUrl ?? crypto.randomUUID();
	const isNewThread = !chatIdFromUrl;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <ThreadsSidebar threadId={threadId} />
        <SidebarInset>
          <div className="flex min-h-svh flex-col">
            <Header />
            <div className="relative flex h-[calc(100dvh-64px)] flex-col">
              <Chat key={threadId} threadId={threadId} isNewThread={isNewThread} initialMessages={initialMessages} />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
