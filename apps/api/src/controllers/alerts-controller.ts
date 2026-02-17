import type { Context } from "hono";
import { requireAuth, requireUserId } from "../middleware/auth-guards";
import { createAlert, listAlerts, runAlertsWorker, toggleAlert } from "../services/alerts-service";
import type { ApiEnv } from "../types/api";
import { jsonLog } from "../utils/logger";

export async function createAlertHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await createAlert(requireUserId(c), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json({ alert: result.alert }, result.status);
}

export async function toggleAlertHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await toggleAlert(requireUserId(c), c.req.param("id"), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json({ alert: result.alert });
}

export async function listAlertsHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  return c.json(await listAlerts(requireUserId(c)));
}

export async function runAlertsWorkerHandler(c: Context<ApiEnv>) {
  const result = await runAlertsWorker();
  jsonLog("info", "alerts.worker.complete", {
    correlationId: c.get("correlationId"),
    processed: result.processed,
  });
  return c.json(result);
}
