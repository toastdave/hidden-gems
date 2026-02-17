import type { MiddlewareHandler } from "hono";
import type { ApiEnv } from "../types/api";
import { generateCorrelationId, jsonLog } from "../utils/logger";

export function requestLoggingMiddleware(isProduction: boolean): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    const correlationIdHeader = c.req.header("x-request-id");
    const correlationId =
      typeof correlationIdHeader === "string" && correlationIdHeader.trim().length > 0
        ? correlationIdHeader.trim()
        : generateCorrelationId();
    c.set("correlationId", correlationId);
    c.header("x-request-id", correlationId);
    const start = Date.now();
    jsonLog("info", "request.start", {
      correlationId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
    });
    try {
      await next();
    } catch (error) {
      jsonLog("error", "request.error", {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        stack: !isProduction && error instanceof Error ? error.stack : undefined,
      });
      throw error;
    } finally {
      jsonLog("info", "request.complete", {
        correlationId,
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status: c.res.status,
        durationMs: Date.now() - start,
      });
    }
  };
}
