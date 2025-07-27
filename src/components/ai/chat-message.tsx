import { Message } from "ai";
import {
  AIMessage,
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
import { memo, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ExternalLinkIcon,
  GlobeIcon,
  LinkIcon,
  SearchIcon,
} from "lucide-react";
import { getFaviconUrl, getOpenGraphImage } from "@/lib/get-url-meta";
import { OurMessageAnnotation } from "@/server/ai/types";

type MessagePart = NonNullable<Message["parts"]>[number];

interface ChatMessageProps {
  parts: MessagePart[];
  role: "user" | "assistant" | "data" | "system";
  userName: string;
  isStreaming: boolean;
  id: string;
  annotations: OurMessageAnnotation[];
}

const FaviconWithLoader = memo(({ url }: { url: string }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative flex aspect-square h-4 w-4 items-center justify-center rounded-full">
      {!imageLoaded && (
        <div className="bg-muted-foreground/10 absolute inset-0 animate-pulse" />
      )}
      <img
        src={getFaviconUrl(url)}
        alt=""
        className={cn(
          "h-4 w-4 rounded-full object-contain",
          !imageLoaded && "opacity-0",
        )}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          setImageLoaded(true);
          const target = e.target as HTMLImageElement;
          target.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'/%3E%3C/svg%3E";
        }}
      />
    </div>
  );
});

const ReasoningSteps = ({
  annotations,
}: {
  annotations: OurMessageAnnotation[];
}) => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  if (annotations.length === 0) return null;

  return (
    <div className="mb-4 w-full">
      <ul className="space-y-1">
        {annotations.map((annotation, index) => {
          const isOpen = openStep === index;
          return (
            <li key={index} className="relative">
              <button
                onClick={() => setOpenStep(isOpen ? null : index)}
                className={`flex w-full min-w-34 flex-shrink-0 items-center rounded px-2 py-1 text-left text-sm transition-colors ${
                  isOpen
                    ? "bg-gray-700 text-gray-200"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                }`}
              >
                <span
                  className={`z-10 mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-500 text-xs font-bold ${
                    isOpen
                      ? "border-blue-400 text-white"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {index + 1}
                </span>
                {annotation.action.title}
              </button>
              <div className={`${isOpen ? "mt-1" : "hidden"}`}>
                {isOpen && (
                  <div className="px-2 py-1">
                    <div className="text-sm text-gray-400 italic">
                      <AIResponse>{annotation.action.reasoning}</AIResponse>
                    </div>
                    {annotation.action.type === "continue" && (
                      <div className="mt-2 flex flex-col gap-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <SearchIcon className="size-4" />
                          <span>Continuing search...</span>
                        </div>
                        <div className="mt-2 border-l-2 border-gray-700 pl-4">
                          <div className="font-medium text-gray-300">
                            Feedback:
                          </div>
                          <AIResponse>{annotation.action.feedback!}</AIResponse>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const WebSearchToolInvocation = memo(
  ({
    links,
  }: {
    links: Array<{ title: string; link: string; snippet: string }>;
  }) => {
    return (
      <AIToolResult
        result={
          <div className="grid grid-cols-1 gap-4">
            {links.map((item, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "group bg-card relative flex-shrink-0 rounded-lg border text-left",
                  "hover:border-primary/20 transition-all duration-200 hover:shadow-lg",
                  "hover:border-primary/20 hover:bg-accent/50",
                  "w-64 min-w-64 overflow-hidden",
                )}
                onClick={() => item.link && window.open(item.link, "_blank")}
                aria-label={`Open ${item.title} in new tab`}
              >
                {item.link && (
                  <div className="bg-muted/30 relative h-32 overflow-hidden">
                    <img
                      src={getOpenGraphImage(item.link)}
                      alt=""
                      className="aspect-video h-full w-full object-cover"
                      style={{
                        margin: "0 auto",
                        maxHeight: "100%",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback =
                          target.nextElementSibling as HTMLDivElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className="bg-muted/50 absolute inset-0 hidden items-center justify-center"
                      style={{ display: "none" }}
                    >
                      <GlobeIcon className="text-muted-foreground/50 size-8" />
                    </div>
                  </div>
                )}

                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    {item.link && <FaviconWithLoader url={item.link} />}

                    <h1 className="leading text-foreground m-0 mb-0 truncate text-base font-semibold">
                      {item.title}
                    </h1>
                  </div>
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                    {item.snippet}
                  </p>

                  {item.link && (
                    <div className="border-border/50 flex items-center gap-1.5 border-t pt-2">
                      <span className="text-muted-foreground/70 flex-1 truncate text-xs">
                        {item.link.replace(/^(https?:\/\/)/, "").split("/")[0]}
                      </span>
                      <ExternalLinkIcon className="text-muted-foreground/50 size-3 flex-shrink-0" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        }
      />
    );
  },
);

const ToolInvocation = memo(
  ({ part }: { part: Extract<MessagePart, { type: "tool-invocation" }> }) => {
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
          {state === "result" && toolName === "searchWeb" && (
            <WebSearchToolInvocation links={toolInvocation.result} />
          )}
        </AIToolContent>
      </AITool>
    );
  },
);

export const ChatMessage = memo(
  ({
    id,
    role,
    userName,
    parts,
    isStreaming,
    annotations,
  }: ChatMessageProps) => {
    return (
      <AIMessage from={role === "user" ? "user" : "assistant"}>
        <AIMessageContent className="w-full">
          {role !== "user" && <ReasoningSteps annotations={annotations} />}
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
      </AIMessage>
    );
  },
);
