import { Router } from "express";

import { uploadRoutes } from "../modules/upload/upload.route";
import { globalSettingRoutes } from "../modules/globalSetting/globalSetting.route";
import { sliderRoutes } from "../modules/slider/slider.route";
import { newsletterRoutes } from "../modules/newsletter/newsletter.route";
import { blogRoutes } from "../modules/blog/blog.route";
import { galleryRoutes } from "../modules/gallery/gallery.route";
import { brandRoutes } from "../modules/brand/brand.route";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { roleRoutes } from "../modules/role/role.route";
import { categoryRoutes } from "../modules/category/category.route";

const router = Router();

const routes = [
  uploadRoutes,
  globalSettingRoutes,
  sliderRoutes,
  newsletterRoutes,
  blogRoutes,
  brandRoutes,
  galleryRoutes,
  userRoutes,
  authRoutes,
  roleRoutes,
  categoryRoutes,
];

routes.forEach((route) => {
  router.use(route);
});

export default router;
