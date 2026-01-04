import express from "express";
import { uploadService } from "../upload/upload";
import { productControllers } from "./product.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = express.Router();

router.post(
  "/product",
  uploadService.any(),
  productControllers.createProductController
);

router.post(
  "/upload-products",
  uploadService.single("file"),
  productControllers.createProductByFileController
);

router.get(
  "/product",
  authMiddleware,
  productControllers.getAllProductController
);

router.get(
  "/product/:productId",
  authMiddleware,
  productControllers.getSingleProductController
);

router.get(
  "/product/sku/:sku",
  authMiddleware,
  productControllers.getSingleProductBySkuController
);

router.get(
  "/product/slug/:productSlug",
  authMiddleware,
  productControllers.getSingleProductBySlugController
);

router.patch(
  "/product/:productId",
  uploadService.any(),
  productControllers.updateSingleProductController
);

router.delete(
  "/product/:productId",
  productControllers.deleteSingleProductController
);

router.post(
  "/product/bulk-delete",
  productControllers.deleteManyProductsController
);

export const productRoutes = router;
