import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    setupFiles: ["dotenv/config"],
    testTimeout: 60_000,
    sequence: {
      concurrent: false, // Ensure tests run sequentially to avoid rate limit on free tier
    },
  },
  plugins: [tsconfigPaths()],
});
