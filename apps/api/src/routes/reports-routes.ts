import { Hono } from "hono";
import {
  listReportsHandler,
  submitReportHandler,
  updateReportStatusHandler,
} from "../controllers/reports-controller";
import type { ApiEnv } from "../types/api";

export const reportsRoutes = new Hono<ApiEnv>();

reportsRoutes.post("/reports", submitReportHandler);
reportsRoutes.get("/admin/reports", listReportsHandler);
reportsRoutes.patch("/admin/reports/:id", updateReportStatusHandler);
