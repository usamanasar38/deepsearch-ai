import { streamText, type StreamTextResult, type Message, type TelemetrySettings } from "ai";
import { model } from "./model";
import { searchSerper } from "../lib/serper";
import { bulkCrawlWebsites } from "../scraper";
import { z } from "zod";
import { env } from "@/env";
import { runAgentLoop } from "./run-agent-loop";

const systemPrompt = `You are a helpful AI assistant with access to real-time web search capabilities. The current date and time is ${new Date().toLocaleString()}. When answering questions:

1. Always search the web for up-to-date information when relevant
2. ALWAYS format URLs as markdown links using the format [title](url)
3. Be thorough but concise in your responses
4. If you're unsure about something, search the web to verify
5. When providing information, always include the source where you found it using markdown links
6. Never include raw URLs - always use markdown link format
7. When users ask for up-to-date information, use the current date to provide context about how recent the information is
8. IMPORTANT: After finding relevant URLs from search results, ALWAYS use the scrapePages tool to get the full content of those pages. Never rely solely on search snippets.

Your workflow should be:
1. Use searchWeb to find ${env.SEARCH_RESULTS_COUNT} relevant URLs from diverse sources (news sites, blogs, official documentation, etc.)
2. Select 4-6 of the most relevant and diverse URLs to scrape
3. Use scrapePages to get the full content of those URLs
4. Use the full content to provide detailed, accurate answers

Remember to:
- Always scrape multiple sources (4-6 URLs) for each query
- Choose diverse sources (e.g., not just news sites or just blogs)
- Prioritize official sources and authoritative websites
- Use the full content to provide comprehensive answers`;

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
  const result = streamFromDeepSearch({
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
