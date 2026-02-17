import { Hono } from "hono";
import {
  billingStatusHandler,
  checkoutHandler,
  listPlansHandler,
  premiumCheckHandler,
  webhookHandler,
} from "../controllers/billing-controller";
import type { ApiEnv } from "../types/api";

export const billingRoutes = new Hono<ApiEnv>();

billingRoutes.get("/billing/plans", listPlansHandler);
billingRoutes.post("/billing/checkout", checkoutHandler);
billingRoutes.post("/billing/webhook", webhookHandler);
billingRoutes.get("/billing/status", billingStatusHandler);
billingRoutes.get("/premium/feature-check", premiumCheckHandler);
