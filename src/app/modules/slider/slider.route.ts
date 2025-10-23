import express from "express";
import { uploadService } from "../upload/upload";
import { sliderControllers } from "./slider.controller";

const router = express.Router();

router.post(
  "/slider/",
  uploadService.fields([
    { name: "attachment", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  sliderControllers.createSliderController
);

router.get("/slider/", sliderControllers.getAllSliderController);

router.get("/slider/:sliderId/", sliderControllers.getSingleSliderController);

router.patch(
  "/slider/:sliderId/",
  uploadService.fields([
    { name: "attachment", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
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
