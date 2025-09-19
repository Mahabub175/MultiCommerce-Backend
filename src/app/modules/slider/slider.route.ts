import express from "express";
import { uploadService } from "../upload/upload";
import { sliderControllers } from "./slider.controller";

const router = express.Router();

router.post(
  "/slider/",
  uploadService.single("attachment"),
  sliderControllers.createSliderController
);

router.get("/slider/", sliderControllers.getAllSliderController);

router.get("/slider/:sliderId/", sliderControllers.getSingleSliderController);

router.patch(
  "/slider/:sliderId/",
  uploadService.single("attachment"),
  sliderControllers.updateSingleSliderController
);

router.delete(
  "/slider/:sliderId/",
  sliderControllers.deleteSingleSliderController
);

router.post(
  "/slider/bulk-delete/",
  sliderControllers.deleteManySlidersController
);

export const sliderRoutes = router;
