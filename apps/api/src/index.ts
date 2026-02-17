import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { errorHandler } from "./middleware/error-handler";
import { requestLoggingMiddleware } from "./middleware/request-logging";
import { sessionContextMiddleware } from "./middleware/session-context";
import { appRoutes } from "./routes";
import type { ApiEnv } from "./types/api";

const app = new Hono<ApiEnv>();
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:4321";
const isProduction = process.env.NODE_ENV === "production";

app.use("*", requestLoggingMiddleware(isProduction));

app.use(
  "*",
  cors({
    origin: clientOrigin,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.use("*", sessionContextMiddleware);
app.route("/", appRoutes);
app.onError(errorHandler(isProduction));

export default {
  port: 3000,
  fetch: app.fetch,
};
