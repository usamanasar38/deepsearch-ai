import { streamText, type StreamTextResult, type Message, type TelemetrySettings } from "ai";
import { runAgentLoop } from "./run-agent-loop";

export const streamFromDeepSearch = (opts: {
  messages: Message[];
  onFinish: Parameters<typeof streamText>[0]["onFinish"];
  telemetry: TelemetrySettings;
}): Promise<StreamTextResult<{}, string>> => {
  const lastMessage = opts.messages[opts.messages.length - 1];
  if (!lastMessage) {
    throw new Error("No messages provided");
  }
  return runAgentLoop(lastMessage.content);
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
