import { Hono } from "hono";
import {
  completeListingMediaUploadHandler,
  createDraftHandler,
  createListingMediaUploadHandler,
  feedHandler,
  getListingHandler,
  getListingMediaHandler,
  mapHandler,
  publishHandler,
  removeListingMediaHandler,
  reorderListingMediaHandler,
  setListingMediaCoverHandler,
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
listingsRoutes.get("/listings/:id/media", getListingMediaHandler);
listingsRoutes.post("/listings/:id/media/upload-url", createListingMediaUploadHandler);
listingsRoutes.post("/listings/:id/media/complete", completeListingMediaUploadHandler);
listingsRoutes.patch("/listings/:id/media/order", reorderListingMediaHandler);
listingsRoutes.post("/listings/:id/media/:mediaId/cover", setListingMediaCoverHandler);
listingsRoutes.delete("/listings/:id/media/:mediaId", removeListingMediaHandler);
