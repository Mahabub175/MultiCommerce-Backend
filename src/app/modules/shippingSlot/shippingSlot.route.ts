import express from "express";
import { shippingSlotControllers } from "./shippingSlot.controller";
import { uploadService } from "../upload/upload";

const router = express.Router();

router.post(
  "/shipping-slot/",
  uploadService.single("attachment"),
  shippingSlotControllers.createShippingSlotController
);
router.get(
  "/shipping-slot/",
  shippingSlotControllers.getAllShippingSlotsController
);
router.get(
  "/shipping-slot/:slotId/",
  shippingSlotControllers.getSingleShippingSlotController
);
router.patch(
  "/shipping-slot/:slotId/",
  uploadService.single("attachment"),
  shippingSlotControllers.updateShippingSlotController
);
router.delete(
  "/shipping-slot/:slotId/",
  shippingSlotControllers.deleteSingleShippingSlotController
);
router.post(
  "/shipping-slot/bulk-delete/",
  shippingSlotControllers.deleteManyShippingSlotsController
);

export const shippingSlotRoutes = router;
