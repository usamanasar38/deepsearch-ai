"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@/components/ui/kibo-ui/ai/conversation";
import {
  AIMessage,
  AIMessageContent,
} from "@/components/ui/kibo-ui/ai/message";
import { Loader } from "../ui/loader";
import { AnimatePresence, motion } from "motion/react";
import { useSession } from "@/hooks/use-auth";
import { SignupMessagePrompt } from "../signup-message-prompt";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNewChatCreated } from "@/utils";
import { UIMessage } from "ai";
import { api } from "@/trpc/react";
import { OurMessageAnnotation } from "@/server/ai/types";
import { useAutoResume } from "@/hooks/use-auto-resume";

interface ChatProps {
  isNewThread: boolean;
  threadId: string | undefined;
  initialMessages: UIMessage[];
}

const Chat = ({ threadId, initialMessages, isNewThread }: ChatProps) => {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: session, isPending } = useSession();
  const { messages, input, status, data, handleInputChange, handleSubmit, setMessages, experimental_resume } = useChat({
    id: threadId,
    body: {
      threadId,
      isNewThread
    },
    initialMessages,
  });

  useAutoResume({
    autoResume: true,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  useEffect(() => {
    const lastDataItem = data?.[data.length - 1];
    if (lastDataItem && isNewChatCreated(lastDataItem)) {
      utils.threads.getThreads.invalidate();
      router.push(`/?id=${lastDataItem.threadId}`);
    }
  }, [data, router]);

  if (!session?.user && !isPending) {
    return (
      <div className="relative flex h-[calc(100dvh-64px)] items-center justify-center">
        <SignupMessagePrompt />
      </div>
    );
  }

  const isEmpty = messages.length === 0 && !threadId;
  const lastMessage = messages[messages.length - 1];

  const isStreamingWithoutContent =
    status === "streaming" &&
    lastMessage?.role === "assistant" &&
    (!lastMessage.parts ||
      lastMessage.parts.length === 0 ||
      lastMessage.parts.every(
        (part) =>
          (part.type === "text" && (!part.text || part.text.trim() === "")) ||
          (part.type === "reasoning" &&
            (!part.reasoning || part.reasoning.trim() === "")),
      ));

  const showTypingLoader = status === "submitted" || isStreamingWithoutContent;

  return (
    <div className="min-h-[90dvh] overflow-y-auto p-4 pt-0">
      <AIConversation className="relative size-full">
        <AIConversationContent className="mx-auto max-w-2xl pb-16">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              id={message.id}
              role={message.role}
              userName={
                session?.user && message.role === "user"
                  ? session.user.name
                  : "AI"
              }
              annotations={(message.annotations ?? []) as OurMessageAnnotation[]}
              parts={message.parts}
              isStreaming={status === "streaming" && message === lastMessage}
            />
          ))}
          {showTypingLoader && (
            <AIMessage from="assistant">
              <AIMessageContent>
                <Loader variant="typing" size="md" />
              </AIMessageContent>
            </AIMessage>
          )}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>
      <AnimatePresence mode="sync">
        {isEmpty ? (
          <motion.div
            key="centered-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="mb-6 opacity-80">Deepsearch</div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-8 text-center"
            >
              <h1 className="text-foreground px-4 text-3xl font-medium">
                What do you want to explore?
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl px-4"
            >
              <ChatInput
                value={input}
                status={status}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="bottom-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-x-0 -bottom-[3.875rem] z-[10] flex flex-col items-center justify-center gap-2 md:-bottom-10"
          >
            <ChatInput
              value={input}
              status={status}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Chat;
