"use client";

import { useChat } from "@ai-sdk/react";

import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@/components/ui/kibo-ui/ai/conversation";
import {
  AIMessage,
  AIMessageAvatar,
  AIMessageContent,
} from "@/components/ui/kibo-ui/ai/message";

import {
  AIInput,
  AIInputButton,
  AIInputModelSelect,
  AIInputModelSelectContent,
  AIInputModelSelectItem,
  AIInputModelSelectTrigger,
  AIInputModelSelectValue,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@/components/ui/kibo-ui/ai/input";
import { GlobeIcon, MicIcon, PlusIcon } from "lucide-react";
import { type FormEventHandler, useState } from "react";
import { AIResponse } from "../ui/kibo-ui/ai/response";
import { Loader } from "../ui/loader";
import { AnimatePresence, motion } from "motion/react";

const messages: {
  from: "user" | "assistant";
  content: string;
  avatar: string;
  name: string;
}[] = [
  {
    from: "user",
    content: "Hello, how are you?",
    avatar: "https://github.com/haydenbleasel.png",
    name: "Hayden Bleasel",
  },
  {
    from: "assistant",
    content: "I am fine, thank you!",
    avatar: "https://github.com/openai.png",
    name: "OpenAI",
  },
  {
    from: "user",
    content: "What is the weather in Tokyo?",
    avatar: "https://github.com/haydenbleasel.png",
    name: "Hayden Bleasel",
  },
  {
    from: "assistant",
    content: "The weather in Tokyo is sunny.",
    avatar: "https://github.com/openai.png",
    name: "OpenAI",
  },
];

const Chat = () => {
  const {
    messages,
    input,
    status,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat();

  const isEmpty = messages.length === 0;
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
        <AIConversationContent>
          {messages.map(({ content, ...message }) => (
            <AIMessage
              from={message.role === "user" ? "user" : "assistant"}
              key={message.id}
            >
              <AIMessageContent>
                <AIResponse>{content}</AIResponse>
              </AIMessageContent>
              {/* <AIMessageAvatar name={message.name} src={message.avatar} /> */}
            </AIMessage>
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
              <AIInput className="max-w-2xl" onSubmit={handleSubmit}>
                <AIInputTextarea onChange={handleInputChange} value={input} />
                <AIInputToolbar>
                  <AIInputTools>
                    {/* <AIInputButton>
                      <PlusIcon size={16} />
                    </AIInputButton>
                    <AIInputButton>
                      <MicIcon size={16} />
                    </AIInputButton>
                    <AIInputButton>
                      <GlobeIcon size={16} />
                      <span>Search</span>
                    </AIInputButton>
                    <AIInputModelSelect onValueChange={setModel} value={model}>
                      <AIInputModelSelectTrigger>
                        <AIInputModelSelectValue />
                      </AIInputModelSelectTrigger>
                      <AIInputModelSelectContent>
                        {models.map((model) => (
                          <AIInputModelSelectItem
                            key={model.id}
                            value={model.id}
                          >
                            {model.name}
                          </AIInputModelSelectItem>
                        ))}
                      </AIInputModelSelectContent>
                    </AIInputModelSelect> */}
                  </AIInputTools>
                  <AIInputSubmit disabled={!input} status={status} />
                </AIInputToolbar>
              </AIInput>
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
            {/* <StickToBottomButton
              isAtBottom={isAtBottom}
              scrollToBottom={scrollToBottom}
            /> */}
            <AIInput className="max-w-2xl" onSubmit={handleSubmit}>
              <AIInputTextarea onChange={handleInputChange} value={input} />
              <AIInputToolbar>
                <AIInputTools>
                  {/* <AIInputButton>
                    <PlusIcon size={16} />
                  </AIInputButton>
                  <AIInputButton>
                    <MicIcon size={16} />
                  </AIInputButton>
                  <AIInputButton>
                    <GlobeIcon size={16} />
                    <span>Search</span>
                  </AIInputButton>
                  <AIInputModelSelect onValueChange={setModel} value={model}>
                    <AIInputModelSelectTrigger>
                      <AIInputModelSelectValue />
                    </AIInputModelSelectTrigger>
                    <AIInputModelSelectContent>
                      {models.map((model) => (
                        <AIInputModelSelectItem key={model.id} value={model.id}>
                          {model.name}
                        </AIInputModelSelectItem>
                      ))}
                    </AIInputModelSelectContent>
                  </AIInputModelSelect> */}
                </AIInputTools>
                <AIInputSubmit disabled={!input} status={status} />
              </AIInputToolbar>
            </AIInput>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Chat;
