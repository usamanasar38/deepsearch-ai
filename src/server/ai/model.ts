import { env } from "@/env";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { google } from "@ai-sdk/google";


// const openrouter = createOpenRouter({
//     apiKey: env.OPENROUTER_API_KEY,
// });

// export const model = openrouter('google/gemini-2.0-flash-001');
export const model = google("gemini-2.0-flash-001");
export const evalsModel = google("gemini-2.0-flash-001");
