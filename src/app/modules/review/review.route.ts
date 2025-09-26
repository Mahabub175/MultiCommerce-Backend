import express from "express";
import { reviewControllers } from "./review.controller";
import { uploadService } from "../upload/upload";

const router = express.Router();

router.post(
  "/product/:productId/review/",
  uploadService.single("attachment"),
  reviewControllers.addReviewToProductController
);

router.get("/product/all/review/", reviewControllers.getAllReviewsController);

router.get(
  "/product/review/:userId/",
  reviewControllers.getReviewsByUserController
);

router.get(
  "/product/review/single/:reviewId/",
  reviewControllers.getSingleReviewController
);

router.patch(
  "/product/:productId/review/:reviewId/",
  uploadService.single("attachment"),
  reviewControllers.updateProductReviewController
);

router.delete(
  "/product/:productId/review/:reviewId/",
  reviewControllers.deleteProductReviewController
);

export const reviewRoutes = router;
