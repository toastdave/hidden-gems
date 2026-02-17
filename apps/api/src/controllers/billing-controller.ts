import type { Context } from "hono";
import { requireAuth, requireUserId } from "../middleware/auth-guards";
import {
  checkPremiumFeature,
  createCheckout,
  getBillingStatus,
  listPlans,
  processWebhook,
} from "../services/billing-service";
import type { ApiEnv } from "../types/api";

export async function listPlansHandler(c: Context<ApiEnv>) {
  return c.json(await listPlans());
}

export async function checkoutHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const payload = (await c.req.json()) as Record<string, unknown>;
  const planSlug = typeof payload.planSlug === "string" ? payload.planSlug : "";
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:4321";
  const result = await createCheckout(requireUserId(c), planSlug, clientOrigin);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function webhookHandler(c: Context<ApiEnv>) {
  const signature = c.req.header("x-polar-signature") ?? "";
  const payloadText = await c.req.text();
  const secret = process.env.POLAR_WEBHOOK_SECRET ?? "";
  const result = await processWebhook(signature, payloadText, secret);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function billingStatusHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  return c.json(await getBillingStatus(requireUserId(c)));
}

export async function premiumCheckHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const result = await checkPremiumFeature(requireUserId(c));
  if (!result.allowed) {
    return c.json({ allowed: false, message: "Upgrade required for this feature." }, 402);
  }
  return c.json(result);
}
