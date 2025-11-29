import express from "express";
import { cartControllers } from "./cart.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = express.Router();

router.post("/cart/", cartControllers.createCartController);

router.get("/cart/", authMiddleware, cartControllers.getAllCartController);

router.get(
  "/cart/:cartId/",
  authMiddleware,
  cartControllers.getSingleCartController
);

router.get(
  "/cart/user/:userId/",
  authMiddleware,
  cartControllers.getSingleCartByUserController
);

router.patch("/cart/:cartId/", cartControllers.updateSingleCartController);

router.patch(
  "/cart/:cartId/product/:productId/:sku/update-quantity/",
  cartControllers.updateCartProductQuantityController
);

router.delete(
  "/cart/:cartId/delete-products/",
  cartControllers.deleteProductsFromCartController
);

router.delete("/cart/:cartId/", cartControllers.deleteSingleCartController);

router.post("/cart/bulk-delete/", cartControllers.deleteManyCartController);

export const cartRoutes = router;
