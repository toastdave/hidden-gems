import { Hono } from "hono";
import {
  createAlertHandler,
  listAlertsHandler,
  runAlertsWorkerHandler,
  toggleAlertHandler,
} from "../controllers/alerts-controller";
import type { ApiEnv } from "../types/api";

export const alertsRoutes = new Hono<ApiEnv>();

alertsRoutes.post("/alerts", createAlertHandler);
alertsRoutes.patch("/alerts/:id", toggleAlertHandler);
alertsRoutes.get("/alerts", listAlertsHandler);
alertsRoutes.post("/alerts/worker/run", runAlertsWorkerHandler);
