import { Hono } from "hono";
import {
  createDraftHandler,
  feedHandler,
  getListingHandler,
  mapHandler,
  publishHandler,
  updateDraftHandler,
} from "../controllers/listings-controller";
import type { ApiEnv } from "../types/api";

export const listingsRoutes = new Hono<ApiEnv>();

listingsRoutes.post("/listings/drafts", createDraftHandler);
listingsRoutes.patch("/listings/:id", updateDraftHandler);
listingsRoutes.post("/listings/:id/publish", publishHandler);
listingsRoutes.get("/listings/feed", feedHandler);
listingsRoutes.get("/listings/map", mapHandler);
listingsRoutes.get("/listings/:id", getListingHandler);
