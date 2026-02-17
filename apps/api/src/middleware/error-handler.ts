import type { ErrorHandler } from "hono";
import type { ApiEnv } from "../types/api";
import { jsonLog } from "../utils/logger";

export function errorHandler(isProduction: boolean): ErrorHandler<ApiEnv> {
  return (err, c) => {
    jsonLog("error", "request.unhandled", {
      correlationId: c.get("correlationId"),
      error: err.message,
      stack: !isProduction ? err.stack : undefined,
    });
    return c.json({ error: "Internal server error." }, 500);
  };
}
