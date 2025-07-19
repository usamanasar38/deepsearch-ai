import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
  appendResponseMessages,
} from "ai";
import { Langfuse } from "langfuse";
import { model } from "@/server/ai/model";
import z from "zod";
import { searchSerper } from "@/server/lib/serper";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { upsertThread } from "@/server/db/queries";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { threads } from "@/server/db/schema/threads";
import { NEW_THREAD_CREATED } from "@/lib/constants";
import { bulkCrawlWebsites } from "@/server/scraper";

import { env } from "@/env";

const langfuse = new Langfuse({
  environment: env.NODE_ENV,
});

const systemPrompt = `You are a helpful AI assistant with access to real-time web search capabilities. The current date and time is ${new Date().toLocaleString()}. When answering questions:

1. Always search the web for up-to-date information when relevant
2. ALWAYS format URLs as markdown links using the format [title](url)
3. Be thorough but concise in your responses
4. If you're unsure about something, search the web to verify
5. When providing information, always include the source where you found it using markdown links
6. Never include raw URLs - always use markdown link format
7. When users ask for up-to-date information, use the current date to provide context about how recent the information is
8. IMPORTANT: After finding relevant URLs from search results, ALWAYS use the scrapePages tool to get the full content of those pages. Never rely solely on search snippets.

Your workflow should be:
1. Use searchWeb to find 10 relevant URLs from diverse sources (news sites, blogs, official documentation, etc.)
2. Select 4-6 of the most relevant and diverse URLs to scrape
3. Use scrapePages to get the full content of those URLs
4. Use the full content to provide detailed, accurate answers

Remember to:
- Always scrape multiple sources (4-6 URLs) for each query
- Choose diverse sources (e.g., not just news sites or just blogs)
- Prioritize official sources and authoritative websites
- Use the full content to provide comprehensive answers`;

const ChatSchema = z.object({
  threadId: z.string(),
  isNewThread: z.boolean(),
  messages: z.array(z.unknown()).min(1),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const schemaParseResult = ChatSchema.safeParse(await request.json());
  if (!schemaParseResult.success) {
    return new Response(
      "Validation failed: " + schemaParseResult.error.message,
      { status: 400 },
    );
  }

  const { messages, threadId, isNewThread } = schemaParseResult.data as {
    threadId: string;
    isNewThread: boolean;
    messages: Message[];
  };

  // If no threadId is provided, create a new thread with the user's message
  if (isNewThread) {
    await upsertThread({
      userId: session.user.id,
      threadId,
      title: messages[messages.length - 1]!.content.slice(0, 50) + "...",
      messages: messages, // Only save the user's message initially
    });
  } else {
    // Verify the thread belongs to the user
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });
    if (!thread || thread.userId !== session.user.id) {
      return new Response("Thread not found or unauthorized", { status: 404 });
    }
  }

  const trace = langfuse.trace({
    sessionId: threadId,
    name: "thread",
    userId: session.user.id,
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // If this is a new thread, send the thread ID to the frontend
      if (isNewThread) {
        dataStream.writeData({
          type: NEW_THREAD_CREATED,
          threadId,
        });
      }

      const result = streamText({
        model,
        messages,
        system: systemPrompt,
        maxSteps: 10,
        experimental_telemetry: {
          isEnabled: true,
          functionId: `chat`,
          metadata: {
            langfuseTraceId: trace.id,
          },
        },
        tools: {
          searchWeb: {
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
            }),
            execute: async ({ query }, { abortSignal }) => {
              const results = await searchSerper(
                { q: query, num: 10 },
                abortSignal,
              );

              return results.organic.map((result) => ({
                title: result.title,
                link: result.link,
                snippet: result.snippet,
                date: result.date,
              }));
            },
          },
          scrapePages: {
            parameters: z.object({
              urls: z.array(z.string()).describe("The URLs to scrape"),
            }),
            execute: async ({ urls }, { abortSignal: _abortSignal }) => {
              const results = await bulkCrawlWebsites({ urls });

              if (!results.success) {
                return {
                  error: results.error,
                  results: results.results.map(({ url, result }) => ({
                    url,
                    success: result.success,
                    data: result.success ? result.data : result.error,
                  })),
                };
              }

              return {
                results: results.results.map(({ url, result }) => ({
                  url,
                  success: result.success,
                  data: result.data,
                })),
              };
            },
          },
        },
        onFinish: async ({ response }) => {
          // Merge the existing messages with the response messages
          const updatedMessages = appendResponseMessages({
            messages,
            responseMessages: response.messages,
          });

          const lastMessage = messages[messages.length - 1];
          if (!lastMessage) {
            return;
          }

          // Save the complete thread history
          await upsertThread({
            userId: session.user.id,
            threadId: threadId,
            title: lastMessage.content.slice(0, 50) + "...",
            messages: updatedMessages,
          });
          await langfuse.flushAsync();
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
}
