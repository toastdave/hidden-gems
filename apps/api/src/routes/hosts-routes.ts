import { Hono } from "hono";
import { createHostHandler, getHostHandler } from "../controllers/hosts-controller";
import type { ApiEnv } from "../types/api";

export const hostsRoutes = new Hono<ApiEnv>();

hostsRoutes.post("/hosts", createHostHandler);
hostsRoutes.get("/hosts/:id", getHostHandler);
