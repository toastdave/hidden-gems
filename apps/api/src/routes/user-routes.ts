import { Hono } from "hono";
import {
  completeAvatarUploadHandler,
  createAvatarUploadHandler,
  getHomeLocationHandler,
  getMyProfileHandler,
  updateHomeLocationHandler,
  updateMyProfileHandler,
} from "../controllers/user-controller";
import type { ApiEnv } from "../types/api";

export const userRoutes = new Hono<ApiEnv>();

userRoutes.get("/users/me", getMyProfileHandler);
userRoutes.patch("/users/me", updateMyProfileHandler);
userRoutes.get("/users/me/location", getHomeLocationHandler);
userRoutes.put("/users/me/location", updateHomeLocationHandler);
userRoutes.post("/users/me/avatar/upload-url", createAvatarUploadHandler);
userRoutes.post("/users/me/avatar/complete", completeAvatarUploadHandler);
