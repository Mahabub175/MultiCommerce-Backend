import express from "express";
import { uploadService } from "../upload/upload";
import { brandControllers } from "./brand.controller";

const router = express.Router();

router.post(
  "/brand/",
  uploadService.single("attachment"),
  brandControllers.createBrandController
);

router.get("/brand/", brandControllers.getAllBrandController);

router.get("/brand/:brandId/", brandControllers.getSingleBrandController);

router.patch(
  "/brand/:brandId/",
  uploadService.single("attachment"),
  brandControllers.updateSingleBrandController
);

router.delete("/brand/:brandId/", brandControllers.deleteSingleBrandController);

router.post("/brand/bulk-delete/", brandControllers.deleteManyBrandsController);

export const brandRoutes = router;
