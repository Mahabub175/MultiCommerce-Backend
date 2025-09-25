import express from "express";
import { wishlistControllers } from "./wishlist.controller";

const router = express.Router();

router.post("/wishlist/", wishlistControllers.createWishlistController);

router.get("/wishlist/", wishlistControllers.getAllWishlistController);

router.get(
  "/wishlist/:wishlistId/",
  wishlistControllers.getSingleWishlistController
);

router.get(
  "/wishlist/user/:userId/",
  wishlistControllers.getSingleWishlistBuyUserController
);

router.patch(
  "/wishlist/:wishlistId/",
  wishlistControllers.updateSingleWishlistController
);

router.delete(
  "/wishlist/:wishlistId/",
  wishlistControllers.deleteSingleWishlistController
);

router.post(
  "/wishlist/bulk-delete/",
  wishlistControllers.deleteManyWishlistController
);

export const wishlistRoutes = router;
