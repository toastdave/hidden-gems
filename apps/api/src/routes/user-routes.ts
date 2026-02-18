import { Hono } from "hono";
import { getHomeLocationHandler, updateHomeLocationHandler } from "../controllers/user-controller";
import type { ApiEnv } from "../types/api";

export const userRoutes = new Hono<ApiEnv>();

userRoutes.get("/users/me/location", getHomeLocationHandler);
userRoutes.put("/users/me/location", updateHomeLocationHandler);
