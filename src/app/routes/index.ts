import { Router } from "express";

import { uploadRoutes } from "../modules/upload/upload.route";
import { globalSettingRoutes } from "../modules/globalSetting/globalSetting.route";
import { sliderRoutes } from "../modules/slider/slider.route";
import { newsletterRoutes } from "../modules/newsletter/newsletter.route";
import { blogRoutes } from "../modules/blog/blog.route";
import { galleryRoutes } from "../modules/gallery/gallery.route";
import { brandRoutes } from "../modules/brand/brand.route";

const router = Router();

const routes = [
  uploadRoutes,
  globalSettingRoutes,
  sliderRoutes,
  newsletterRoutes,
  blogRoutes,
  brandRoutes,
  galleryRoutes,
];

routes.forEach((route) => {
  router.use(route);
});

export default router;
