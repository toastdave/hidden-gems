import type { Context } from "hono";
import { requireAuth, requireUserId } from "../middleware/auth-guards";
import { listReports, submitReport, updateReportStatus } from "../services/reports-service";
import type { ApiEnv } from "../types/api";
import { isAdmin } from "../utils/auth";

export async function submitReportHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await submitReport(requireUserId(c), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json({ report: result.report }, result.status);
}

export async function listReportsHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const user = c.get("user");
  if (!user || !isAdmin(user.email)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  return c.json(await listReports());
}

export async function updateReportStatusHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const user = c.get("user");
  if (!user || !isAdmin(user.email)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await updateReportStatus(c.req.param("id"), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json({ report: result.report });
}
