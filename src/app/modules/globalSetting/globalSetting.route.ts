import express from "express";
import { uploadService } from "../upload/upload";
import { globalSettingControllers } from "./globalSetting.controller";

const router = express.Router();

router.post(
  "/global-setting/",
  uploadService.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
    { name: "aboutBanner", maxCount: 1 },
    { name: "serviceBanner", maxCount: 1 },
    { name: "workBanner", maxCount: 1 },
    { name: "galleryBanner", maxCount: 1 },
    { name: "processBanner", maxCount: 1 },
    { name: "shopBanner", maxCount: 1 },
    { name: "contactBanner", maxCount: 1 },
    { name: "blogBanner", maxCount: 1 },
  ]),
  globalSettingControllers.createGlobalSettingController
);

router.get(
  "/global-setting/",
  globalSettingControllers.getAllGlobalSettingController
);

router.patch(
  "/global-setting/:globalSettingId/",
  uploadService.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
    { name: "aboutBanner", maxCount: 1 },
    { name: "serviceBanner", maxCount: 1 },
    { name: "workBanner", maxCount: 1 },
    { name: "processBanner", maxCount: 1 },
    { name: "galleryBanner", maxCount: 1 },
    { name: "shopBanner", maxCount: 1 },
    { name: "contactBanner", maxCount: 1 },
    { name: "blogBanner", maxCount: 1 },
  ]),
  globalSettingControllers.updateSingleGlobalSettingController
);

export const globalSettingRoutes = router;
