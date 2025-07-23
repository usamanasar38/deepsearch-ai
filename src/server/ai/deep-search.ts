import { streamText, type StreamTextResult, type Message, type TelemetrySettings } from "ai";
import { runAgentLoop } from "./run-agent-loop";
import { OurMessageAnnotation } from "./types";

export const streamFromDeepSearch = (opts: {
  messages: Message[];
  onFinish: Parameters<typeof streamText>[0]["onFinish"];
  langfuseTraceId: string | undefined;
  writeMessageAnnotation: (annotation: OurMessageAnnotation) => void;
}): Promise<StreamTextResult<{}, string>> => {
  return runAgentLoop(opts.messages, {
    langfuseTraceId: opts.langfuseTraceId,
    writeMessageAnnotation: opts.writeMessageAnnotation,
    onFinish: opts.onFinish,
  });
};

export async function askDeepSearch(messages: Message[]) {
  const result = await streamFromDeepSearch({
    messages,
    onFinish: () => {}, // just a stub
    telemetry: {
      isEnabled: false,
    },
  });

  // Consume the stream - without this,
  // the stream will never finish
  await result.consumeStream();

  return result.text;
}
