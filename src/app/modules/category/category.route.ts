import express from "express";
import { uploadService } from "../upload/upload";
import { categoryControllers } from "./category.controller";

const router = express.Router();

router.post(
  "/category/",
  uploadService.single("attachment"),
  categoryControllers.createCategoryController
);

router.get("/category/", categoryControllers.getAllCategoryController);

router.get(
  "/category/:categoryId/",
  categoryControllers.getSingleCategoryController
);

router.get(
  "/category/nested/all/",
  categoryControllers.getNestedCategoriesController
);

router.patch(
  "/category/:categoryId/",
  uploadService.single("attachment"),
  categoryControllers.updateSingleCategoryController
);

router.patch(
  "/category/order/:categoryId/",
  categoryControllers.updateCategoryOrderController
);

router.delete(
  "/category/:categoryId/",
  categoryControllers.deleteSingleCategoryController
);

router.post(
  "/category/bulk-delete/",
  categoryControllers.deleteManyCategoriesController
);

export const categoryRoutes = router;
