import express from "express";
import { uploadService } from "../upload/upload";
import { blogControllers } from "./blog.controller";

const router = express.Router();

router.post(
  "/blog/",
  uploadService.single("attachment"),
  blogControllers.createBlogController
);

router.get("/blog/", blogControllers.getAllBlogController);

router.get("/blog/:blogId/", blogControllers.getSingleBlogController);

router.get(
  "/blog/slug/:blogSlug/",
  blogControllers.getSingleBlogBySlugController
);

router.patch(
  "/blog/:blogId/",
  uploadService.single("attachment"),
  blogControllers.updateSingleBlogController
);

router.delete("/blog/:blogId/", blogControllers.deleteSingleBlogController);

router.post("/blog/bulk-delete/", blogControllers.deleteManyBlogsController);

export const blogRoutes = router;
