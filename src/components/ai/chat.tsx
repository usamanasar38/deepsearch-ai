"use client";

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
  return (
    <div className="min-h-[90dvh] overflow-y-auto p-4 pt-0">

    <AIConversation className="relative size-full rounded-lg border">
      <AIConversationContent>
        {messages.map(({ content, ...message }, index) => (
          <AIMessage from={message.from} key={index}>
            <AIMessageContent>{content}</AIMessageContent>
            <AIMessageAvatar name={message.name} src={message.avatar} />
          </AIMessage>
        ))}
      </AIConversationContent>
      <AIConversationScrollButton />
    </AIConversation>
    </div>
  );
};
export default Chat;
