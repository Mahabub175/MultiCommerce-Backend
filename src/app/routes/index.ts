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
import { categoryRoutes } from "../modules/category/category.route";
import { attributeOptionRoutes } from "../modules/attributeOption/attributeOption.route";
import { attributeRoutes } from "../modules/attribute/attribute.route";
import { productRoutes } from "../modules/product/product.route";
import { wishlistRoutes } from "../modules/wishlist/wishlist.route";
import { cartRoutes } from "../modules/cart/cart.route";
import { couponRoutes } from "../modules/coupon/coupon.route";
import { giftCardRoutes } from "../modules/giftCard/giftCard.route";
import { reviewRoutes } from "../modules/review/review.route";
import { orderRoutes } from "../modules/order/order.route";
import { managementRoleRoutes } from "../modules/managementRole/managementRole.route";
import { customRoleRoutes } from "../modules/customRole/customRole.route";
import { reserveOrderRoutes } from "../modules/reserveOrder/reserveOrder.route";
import { shippingOrderRoutes } from "../modules/shippingOrder/shippingOrder.route";
import { courierRoutes } from "../modules/courier/courier.route";
import { shippingAreaRoutes } from "../modules/shippingArea/shippingArea.route";

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
  customRoleRoutes,
  managementRoleRoutes,
  categoryRoutes,
  attributeOptionRoutes,
  attributeRoutes,
  productRoutes,
  wishlistRoutes,
  cartRoutes,
  couponRoutes,
  giftCardRoutes,
  reviewRoutes,
  orderRoutes,
  courierRoutes,
  shippingAreaRoutes,
  shippingOrderRoutes,
  reserveOrderRoutes,
];

routes.forEach((route) => {
  router.use(route);
});

export default router;
