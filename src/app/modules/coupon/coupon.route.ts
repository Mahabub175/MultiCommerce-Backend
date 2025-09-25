import express from "express";
import { uploadService } from "../upload/upload";
import { couponControllers } from "./coupon.controller";

const router = express.Router();

router.post(
  "/coupon/",
  uploadService.single("attachment"),
  couponControllers.createCouponController
);

router.get("/coupon/", couponControllers.getAllCouponController);

router.get("/coupon/:couponId/", couponControllers.getSingleCouponController);

router.get(
  "/coupon/code/:couponCode/",
  couponControllers.getSingleCouponByCodeController
);

router.patch(
  "/coupon/:couponId/",
  uploadService.single("attachment"),
  couponControllers.updateSingleCouponController
);

router.delete(
  "/coupon/:couponId/",
  couponControllers.deleteSingleCouponController
);

router.post(
  "/coupon/bulk-delete/",
  couponControllers.deleteManyCouponController
);

export const couponRoutes = router;
