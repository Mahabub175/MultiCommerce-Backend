import express from "express";
import { shippingControllers } from "./shipping.controller";
import { uploadService } from "../upload/upload";

const router = express.Router();

router.post(
  "/shipping-slot/",
  uploadService.single("attachment"),
  shippingControllers.createShippingSlotController
);
router.get(
  "/shipping-slot/",
  shippingControllers.getAllShippingSlotsController
);
router.get(
  "/shipping-slot/:slotId/",
  shippingControllers.getSingleShippingSlotController
);
router.patch(
  "/shipping-slot/:slotId/",
  uploadService.single("attachment"),
  shippingControllers.updateShippingSlotController
);
router.delete(
  "/shipping-slot/:slotId/",
  shippingControllers.deleteSingleShippingSlotController
);
router.post(
  "/shipping-slot/bulk-delete/",
  shippingControllers.deleteManyShippingSlotsController
);

router.post(
  "/shipping-order/",
  shippingControllers.createShippingOrderController
);
router.get(
  "/shipping-order/",
  shippingControllers.getAllShippingOrdersController
);
router.get(
  "/shipping-order/:orderId/",
  shippingControllers.getSingleShippingOrderController
);
router.patch(
  "/shipping-order/:orderId/",
  shippingControllers.updateSingleShippingOrderController
);
router.patch(
  "/shipping-order/:orderId/status/",
  shippingControllers.updateShippingStatusController
);
router.patch(
  "/shipping-order/:orderId/assign-slot/",
  shippingControllers.assignShippingSlotController
);
router.delete(
  "/shipping-order/:orderId/",
  shippingControllers.deleteSingleShippingOrderController
);
router.post(
  "/shipping-order/bulk-delete/",
  shippingControllers.deleteManyShippingOrdersController
);

export const shippingRoutes = router;
