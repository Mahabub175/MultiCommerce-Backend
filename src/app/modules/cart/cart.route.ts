import express from "express";
import { cartControllers } from "./cart.controller";

const router = express.Router();

router.post("/cart/", cartControllers.createCartController);

router.get("/cart/", cartControllers.getAllCartController);

router.get("/cart/:cartId/", cartControllers.getSingleCartController);

router.get(
  "/cart/user/:userId/",
  cartControllers.getSingleCartByUserController
);

router.patch("/cart/:cartId/", cartControllers.updateSingleCartController);

router.patch(
  "/cart/:cartId/product/:productId/:sku/update-quantity/",
  cartControllers.updateCartProductQuantityController
);

router.delete(
  "/cart/:cartId/delete-products/",
  cartControllers.deleteProductFromCartController
);

router.delete("/cart/:cartId/", cartControllers.deleteSingleCartController);

router.post("/cart/bulk-delete/", cartControllers.deleteManyCartController);

export const cartRoutes = router;
