import express from "express";
import { uploadService } from "../upload/upload";
import { galleryControllers } from "./gallery.controller";

const router = express.Router();

router.post(
  "/gallery/",
  uploadService.single("attachment"),
  galleryControllers.createGalleryController
);

router.get("/gallery/", galleryControllers.getAllGalleryController);

router.get(
  "/gallery/:galleryId/",
  galleryControllers.getSingleGalleryController
);

router.patch(
  "/gallery/:galleryId/",
  uploadService.single("attachment"),
  galleryControllers.updateSingleGalleryController
);

router.delete(
  "/gallery/:galleryId/",
  galleryControllers.deleteSingleGalleryController
);

router.post(
  "/gallery/bulk-delete/",
  galleryControllers.deleteManyGalleryController
);

export const galleryRoutes = router;
