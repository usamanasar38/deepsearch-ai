import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";
import { env } from "./env";

export function register() {
  registerOTel({
    serviceName: "deepsearch-ai",
    traceExporter: new LangfuseExporter({
      environment: env.NODE_ENV,
    }),
  });
}