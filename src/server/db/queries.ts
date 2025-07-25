import { db } from ".";
import { threads, messages } from "./schema/threads";
import type { Message } from "ai";
import { eq, and } from "drizzle-orm";

export const upsertThread = async (opts: {
  userId: string;
  threadId: string;
  title?: string;
  messages: Message[];
}) => {
  const { userId, threadId: threadId, title, messages: newMessages } = opts;

  // First, check if the thread exists and belongs to the user
  const existingThread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (existingThread) {
    // If thread exists but belongs to a different user, throw error
    if (existingThread.userId !== userId) {
      throw new Error("Thread ID already exists under a different user");
    }
    // Delete all existing messages
    await db.delete(messages).where(eq(messages.threadId, threadId));
  } else {
    // Create new thread
    await db.insert(threads).values({
      id: threadId,
      userId,
      title: title ?? "Untitled Thread",
    });
  }

  // Insert all messages
  await db.insert(messages).values(
    newMessages.map((message, index) => ({
      id: crypto.randomUUID(),
      threadId: threadId,
      role: message.role,
      parts: message.parts,
      annotations: message.annotations,
      order: index,
    })),
  );

  if (existingThread && title) {
    // Update thread title if provided
    await db.update(threads).set({ title }).where(eq(threads.id, threadId));
  }

  return { id: threadId };
};

export const getThread = async (opts: { userId: string; threadId: string }) => {
  const { userId, threadId } = opts;

  const thread = await db.query.threads.findFirst({
    where: and(eq(threads.id, threadId), eq(threads.userId, userId)),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.order)],
      },
    },
  });

  if (!thread) {
    return null;
  }

  return {
    ...thread,
    messages: thread.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.parts,
      annotations: message.annotations,
    })),
  };
};

export const getThreads = async (opts: { userId: string }) => {
  const { userId } = opts;

  return await db.query.threads.findMany({
    where: eq(threads.userId, userId),
    orderBy: (threads, { desc }) => [desc(threads.updatedAt)],
  });
};
