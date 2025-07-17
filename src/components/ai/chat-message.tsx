import { Message } from "ai";
import {
  AIMessage,
  AIMessageAvatar,
  AIMessageContent,
} from "@/components/ui/kibo-ui/ai/message";
import { AIResponse } from "../ui/kibo-ui/ai/response";
import {
  AITool,
  AIToolContent,
  AIToolHeader,
  AIToolParameters,
  AIToolResult,
  type AIToolStatus,
} from "@/components/ui/kibo-ui/ai/tool";
import {
  AIReasoning,
  AIReasoningContent,
  AIReasoningTrigger,
} from "../ui/kibo-ui/ai/reasoning";
import { memo, useMemo } from "react";

type MessagePart = NonNullable<Message["parts"]>[number];

interface ChatMessageProps {
  parts: MessagePart[];
  role: "user" | "assistant" | "data" | "system";
  userName: string;
  isStreaming: boolean;
  id: string;
}

const ToolInvocation = memo(({
  part,
}: {
  part: Extract<MessagePart, { type: "tool-invocation" }>;
}) => {
  const { toolInvocation } = part;
  const { state, toolName, args } = toolInvocation;

  const status = useMemo<AIToolStatus>(() => {
    switch (state) {
      case "partial-call":
      case "call":
        return "running";
      case "result":
        return "completed";
      default:
        return "running";
    }
  }, [state]);

  return (
    <AITool key={toolName} status={status}>
      <AIToolHeader name={toolName} status={status} />
      <AIToolContent>
        <AIToolParameters parameters={toolInvocation.args} />
        {state === "result" && (
          <AIToolResult
            result={<AIResponse>{toolInvocation.result}</AIResponse>}
          />
        )}
      </AIToolContent>
    </AITool>
  );
});

export const ChatMessage = memo(({
  id,
  role,
  userName,
  parts,
  isStreaming,
}: ChatMessageProps) => {
  return (
    <AIMessage from={role === "user" ? "user" : "assistant"}>
      <AIMessageContent>
        {parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <AIResponse key={`${id}-text-${index}`}>{part.text}</AIResponse>
            );
          }
          if (part.type === "reasoning") {
            const hasReasoningContent =
              part.reasoning && part.reasoning.trim() !== "";
            const isReasoningStreaming =
              isStreaming &&
              (!hasReasoningContent || part.reasoning.endsWith(""));
            return (
              <AIReasoning
                className="w-full"
                key={`${id}-reasoning-${index}`}
                isStreaming={isReasoningStreaming}
              >
                <AIReasoningTrigger />
                <AIReasoningContent>{part.reasoning}</AIReasoningContent>
              </AIReasoning>
            );
          }
          if (part.type === "tool-invocation") {
            return <ToolInvocation key={`${id}-tool-${index}`} part={part} />;
          }
          return null;
        })}
      </AIMessageContent>
      <AIMessageAvatar name={userName} src="" />
    </AIMessage>
  );
});
