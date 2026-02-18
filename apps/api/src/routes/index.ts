import { Hono } from "hono";
import type { ApiEnv } from "../types/api";
import { alertsRoutes } from "./alerts-routes";
import { billingRoutes } from "./billing-routes";
import { favoritesRoutes } from "./favorites-routes";
import { healthRoutes } from "./health-routes";
import { hostsRoutes } from "./hosts-routes";
import { listingsRoutes } from "./listings-routes";
import { reportsRoutes } from "./reports-routes";
import { userRoutes } from "./user-routes";

export const appRoutes = new Hono<ApiEnv>();

appRoutes.route("/", healthRoutes);
appRoutes.route("/", hostsRoutes);
appRoutes.route("/", listingsRoutes);
appRoutes.route("/", favoritesRoutes);
appRoutes.route("/", alertsRoutes);
appRoutes.route("/", billingRoutes);
appRoutes.route("/", reportsRoutes);
appRoutes.route("/", userRoutes);
