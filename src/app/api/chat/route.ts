import { after } from "next/server";
import type { Message } from "ai";
import { env } from "@/env";
import {
  createDataStreamResponse,
  appendResponseMessages,
  createDataStream,
} from "ai";
import { Langfuse } from "langfuse";
import z from "zod";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import {
  appendStreamId,
  getStreamIds,
  getThread,
  upsertThread,
} from "@/server/db/queries";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { threads } from "@/server/db/schema/threads";
import { NEW_THREAD_CREATED } from "@/lib/constants";
import { streamFromDeepSearch } from "@/server/ai/deep-search";
import { checkRateLimit, recordRateLimit } from "@/server/lib/rate-limit";
import { OurMessageAnnotation } from "@/server/ai/types";
import { generateThreadTitle } from "@/server/ai/generate-title";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import Redis from "ioredis";

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

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
        publisher: new Redis(env.REDIS_URL),
        subscriber: new Redis(env.REDIS_URL),
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL",
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

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

  let titlePromise: Promise<string> | undefined;

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
      title: "Generating...",
      messages: messages, // Only save the user's message initially
    });
    titlePromise = generateThreadTitle(messages);
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
    titlePromise = Promise.resolve("");
  }

  trace.update({
    sessionId: threadId,
  });

  const annotations: OurMessageAnnotation[] = [];
  const streamId = crypto.randomUUID();

  // Record this new stream so we can resume later
  await appendStreamId({ threadId, streamId });

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
        langfuseTraceId: trace.id,
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
          // Add the annotations to the last message
          updatedMessages[updatedMessages.length - 1].annotations = annotations;

          // Wait for the title to be generated
          const title = await titlePromise;

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
            title,
            messages: updatedMessages,
          });
          saveChatSpan.end({
            output: {
              success: true,
            },
          });
          await langfuse.flushAsync();
        },
        writeMessageAnnotation: (annotation: OurMessageAnnotation) => {
          // Save the annotation in-memory
          annotations.push(annotation);
          // Send it to the client
          dataStream.writeMessageAnnotation(annotation);
        },
      });

      result.mergeIntoDataStream(dataStream);

      // Consume the stream - without this,
      // we won't be able to resume the stream later
      await result.consumeStream();
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("chatId");

  if (!threadId) {
    return new Response("id is required", { status: 400 });
  }

  const thread = await getThread({ threadId, userId: session.user.id });

  if (!thread) {
    return new Response("Chat not found", { status: 404 });
  }

  const { mostRecentStreamId, streamIds } = await getStreamIds({ threadId });

  if (!streamIds.length) {
    return new Response("No streams found", { status: 404 });
  }

  if (!mostRecentStreamId) {
    return new Response("No recent stream found", { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    mostRecentStreamId,
    () => emptyDataStream,
  );

  if (stream) {
    return new Response(stream, { status: 200 });
  }

  /*
   * For when the generation is "active" during SSR but the
   * resumable stream has concluded after reaching this point.
   */

  const messages = thread.messages;
  const mostRecentMessage = messages.at(-1);

  if (!mostRecentMessage || mostRecentMessage.role !== "assistant") {
    return new Response(emptyDataStream, { status: 200 });
  }

  const streamWithMessage = createDataStream({
    execute: (buffer) => {
      buffer.writeData({
        type: "append-message",
        message: JSON.stringify(mostRecentMessage),
      });
    },
  });

  return new Response(streamWithMessage, { status: 200 });
}
