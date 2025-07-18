import { NEW_THREAD_CREATED } from "./lib/constants";

export function isNewChatCreated(data: unknown): data is {
  type: typeof NEW_THREAD_CREATED;
  chatId: string;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === NEW_THREAD_CREATED &&
    "threadId" in data &&
    typeof data.threadId === "string"
  );
}
