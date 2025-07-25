import { SystemContext } from "./system-context";
import { getNextAction } from "./get-next-action";
import { searchSerper } from "../lib/serper";
import { bulkCrawlWebsites } from "@/server/scraper";
import { streamText, type StreamTextResult, type Message } from "ai";
import { answerQuestion } from "@/server/ai/answer-question";
import type { OurMessageAnnotation } from "./types";
import { env } from "@/env";
import { summarizeURL } from "./summarize-url";

export async function runAgentLoop(
  messages: Message[],
  opts: {
    langfuseTraceId?: string;
    writeMessageAnnotation?: (annotation: OurMessageAnnotation) => void;
    onFinish: Parameters<typeof streamText>[0]["onFinish"];
  },
): Promise<StreamTextResult<{}, string>> {
  // A persistent container for the state of our system
  const ctx = new SystemContext(messages);

  // A loop that continues until we have an answer
  // or we've taken 10 actions
  while (!ctx.shouldStop()) {
    // We choose the next action based on the state of our system
    const nextAction = await getNextAction(ctx, opts);

    // Send the action as an annotation if writeMessageAnnotation is provided
    if (opts.writeMessageAnnotation) {
      opts.writeMessageAnnotation({
        type: "NEW_ACTION",
        action: nextAction,
      });
    }

    // We execute the action and update the state of our system
    if (nextAction.type === "search") {
      if (!nextAction.query) {
        throw new Error("Query is required for search action");
      }
      const searchResults = await searchSerper(
        { q: nextAction.query, num: env.SEARCH_RESULTS_COUNT },
        undefined,
      );

      const searchResultUrls = searchResults.organic.map((r) => r.link);

      const crawlResults = await bulkCrawlWebsites({ urls: searchResultUrls });
      const summaries = await Promise.all(
        searchResults.organic.map(async (result) => {
          const crawlData = crawlResults.success
            ? crawlResults.results.find((cr) => cr.url === result.link)
            : undefined;

          const scrapedContent = crawlData?.result.success
            ? crawlData.result.data
            : "Failed to scrape.";

          const summary = await summarizeURL({
            conversation: ctx.getMessageHistory(),
            scrapedContent,
            searchMetadata: {
              date: result.date || new Date().toISOString(),
              title: result.title,
              url: result.link,
            },
            query: nextAction.query!, // query is guaranteed to exist
            langfuseTraceId: opts.langfuseTraceId,
          });

          return {
            ...result,
            summary,
          };
        }),
      );

      ctx.reportSearch({
        query: nextAction.query,
        results: summaries.map((summaryResult) => ({
          date: summaryResult.date || new Date().toISOString(),
          title: summaryResult.title,
          url: summaryResult.link,
          snippet: summaryResult.snippet,
          summary: summaryResult.summary,
        })),
      });
    } else if (nextAction.type === "answer") {
      return answerQuestion(ctx, { isFinal: false, ...opts });
    }

    // We increment the step counter
    ctx.incrementStep();
  }

  // If we've taken 10 actions and haven't answered yet,
  // we ask the LLM to give its best attempt at an answer
  return answerQuestion(ctx, { isFinal: true, ...opts });
}
