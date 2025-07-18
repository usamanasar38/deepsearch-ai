import { queryOptions } from "@tanstack/react-query";
import { DB } from "@/server/db/schema/threads";
import { Message } from "ai";

const queryKeys = {
  all: () => ["threads"] as const,
  getThreads: () => [...queryKeys.all(), "list"] as const,
  getThread: (threadId: string) =>
    [...queryKeys.all(), "thread", threadId] as const,
};

export const getThreadsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.getThreads(),
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/threads", { signal });
      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }
      return response.json() as Promise<DB.Thread[]>;
    },
  });

export const getThreadQueryOptions = (threadId: string | undefined) =>
  queryOptions({
    queryKey: queryKeys.getThread(threadId as string),
    enabled: !!threadId,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/threads/${threadId}`, { signal });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const thread = (await response.json()) as DB.Thread & {
        messages: DB.Message[];
      };
      return {
        ...thread,
        messages:
          thread.messages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            parts: msg.parts as Message["parts"],
            content: "",
          })) ?? [],
      };
    },
  });
