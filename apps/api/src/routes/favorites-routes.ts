import { Hono } from "hono";
import { listFavoritesHandler, toggleFavoriteHandler } from "../controllers/favorites-controller";
import type { ApiEnv } from "../types/api";

export const favoritesRoutes = new Hono<ApiEnv>();

favoritesRoutes.post("/favorites/toggle", toggleFavoriteHandler);
favoritesRoutes.get("/favorites", listFavoritesHandler);
