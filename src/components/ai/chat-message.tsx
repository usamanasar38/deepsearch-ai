import {
  AIMessage,
  AIMessageAvatar,
  AIMessageContent,
} from "@/components/ui/kibo-ui/ai/message";
import { AIResponse } from "../ui/kibo-ui/ai/response";

interface ChatMessageProps {
  text: string;
  role:  "user" | "assistant" | "data" | "system";
  userName: string;
}

export const ChatMessage = ({ text, role, userName }: ChatMessageProps) => {
  return (
    <AIMessage
      from={role === "user" ? "user" : "assistant"}
    >
      <AIMessageContent>
        <AIResponse>{text}</AIResponse>
      </AIMessageContent>
      <AIMessageAvatar name={userName} src="" />
    </AIMessage>
  );
};
