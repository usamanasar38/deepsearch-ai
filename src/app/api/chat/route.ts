import type { Message } from "ai";
import { env } from "@/env";
import { createDataStreamResponse, appendResponseMessages, } from "ai";
import { Langfuse } from "langfuse";
import z from "zod";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { upsertThread } from "@/server/db/queries";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { threads } from "@/server/db/schema/threads";
import { NEW_THREAD_CREATED } from "@/lib/constants";
import { streamFromDeepSearch } from "@/server/ai/deep-search";
import { checkRateLimit, recordRateLimit } from "@/server/lib/rate-limit";

const langfuse = new Langfuse({
  environment: env.NODE_ENV,
});

const ChatSchema = z.object({
  threadId: z.string(),
  isNewThread: z.boolean(),
  messages: z.array(z.unknown()).min(1),
});


// Rate limit configuration
const rateLimitConfig = {
	maxRequests: 20,
	maxRetries: 3,
	windowMs: 60_000, // 20 seconds
	keyPrefix: "chat",
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const schemaParseResult = ChatSchema.safeParse(await request.json());
  if (!schemaParseResult.success) {
    return new Response(
      "Validation failed: " + schemaParseResult.error.message,
      { status: 400 },
    );
  }
  // Check rate limit before processing the request
  const rateLimitCheck = await checkRateLimit(rateLimitConfig);
  if (!rateLimitCheck.allowed) {
    console.log("Rate limit exceeded, waiting...");
    const isAllowed = await rateLimitCheck.retry();

    if (!isAllowed) {
      return new Response("Rate limit exceeded", {
        status: 429,
      });
    }
  }

  // Record the request after successful rate limit check
  await recordRateLimit(rateLimitConfig);

  const trace = langfuse.trace({
    name: "chat",
    userId: session.user.id,
  });

  const { messages, threadId, isNewThread } = schemaParseResult.data as {
    threadId: string;
    isNewThread: boolean;
    messages: Message[];
  };

  // If no threadId is provided, create a new thread with the user's message
  if (isNewThread) {
    const createChatSpan = trace.span({
      name: "create-new-thread",
      input: {
        userId: session.user.id,
        title: messages[messages.length - 1]!.content.slice(0, 50),
        messages,
      },
    });
    await upsertThread({
      userId: session.user.id,
      threadId,
      title: messages[messages.length - 1]!.content.slice(0, 50) + "...",
      messages: messages, // Only save the user's message initially
    });
    createChatSpan.end({
      output: {
        threadId,
      },
    });
  } else {
    // Verify the thread belongs to the user
    const verifyChatSpan = trace.span({
      name: "verify-chat-ownership",
      input: {
        threadId,
        userId: session.user.id,
      },
    });

    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });
    verifyChatSpan.end({
      output: {
        exists: !!thread,
        belongsToUser: thread?.userId === session.user.id,
      },
    });
    if (!thread || thread.userId !== session.user.id) {
      return new Response("Thread not found or unauthorized", { status: 404 });
    }
  }

  trace.update({
    sessionId: threadId,
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

      const result = await streamFromDeepSearch({
        messages,
        telemetry: {
          isEnabled: true,
          functionId: `chat`,
          metadata: {
            langfuseTraceId: trace.id,
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

          const saveChatSpan = trace.span({
            name: "save-chat-history",
            input: {
              userId: session.user.id,
              threadId,
              title: lastMessage.content.slice(0, 50),
              messageCount: updatedMessages.length,
            },
          });

          // Save the complete thread history
          await upsertThread({
            userId: session.user.id,
            threadId: threadId,
            title: lastMessage.content.slice(0, 50) + "...",
            messages: updatedMessages,
          });
          saveChatSpan.end({
            output: {
              success: true,
            },
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
