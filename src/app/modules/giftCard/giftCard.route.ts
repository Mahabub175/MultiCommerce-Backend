import express from "express";
import { uploadService } from "../upload/upload";
import { giftCardControllers } from "./giftCard.controller";

const router = express.Router();

router.post(
  "/gift-card/",
  uploadService.single("attachment"),
  giftCardControllers.createGiftCardController
);

router.get("/gift-card/", giftCardControllers.getAllGiftCardController);

router.get(
  "/gift-card/:giftCardId/",
  giftCardControllers.getSingleGiftCardController
);

router.get(
  "/gift-card/code/:giftCardCode/",
  giftCardControllers.getSingleCouponByCodeController
);

router.patch(
  "/gift-card/:giftCardId/",
  uploadService.single("attachment"),
  giftCardControllers.updateSingleGiftCardController
);

router.delete(
  "/gift-card/:giftCardId/",
  giftCardControllers.deleteSingleGiftCardController
);

router.post(
  "/gift-card/bulk-delete/",
  giftCardControllers.deleteManyGiftCardController
);

export const giftCardRoutes = router;
