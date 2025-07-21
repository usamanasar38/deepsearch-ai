import type { Message } from "ai";
import { evalite } from "evalite";
import { askDeepSearch } from "@/server/ai/deep-search";
import { Factuality } from "@/factuality.scorer";
import { devData } from "./data-sets/dev";
import { env } from "@/env";
import { ciData } from "./data-sets/ci";
import { regressionData } from "./data-sets/regression";
import { EvalData } from "./data-sets/type";
import { AnswerRelevancy } from "@/answer-relevancy.scorer";

evalite("Deep Search Eval", {
  data: async (): Promise<EvalData[]> => {
    let data = [...devData];

    // If CI, add the CI data
    if (env.EVAL_DATASET === "ci") {
      data = [...data, ...ciData];
    }
    // If Regression, add the regression data AND the CI data
    else if (env.EVAL_DATASET === "regression") {
      data = [...data, ...ciData, ...regressionData];
    }

    return data;
  },
  task: async (input) => {
    const messages: Message[] = [
      {
        id: "1",
        role: "user",
        content: input,
      },
    ];
    return askDeepSearch(messages);
  },
  scorers: [
    {
      name: "Contains Links",
      description: "Checks if the output contains any markdown links.",
      scorer: ({ output }) => {
        // Regular expression to match markdown links [text](url)
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
        const containsLinks = markdownLinkRegex.test(output);
        return containsLinks ? 1 : 0;
      },
    },
    Factuality,
    AnswerRelevancy,
  ],
});
