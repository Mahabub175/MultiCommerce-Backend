import express from "express";
import { shippingOrderControllers } from "./shippingOrder.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = express.Router();

router.post(
  "/shipping-order/",
  shippingOrderControllers.createShippingOrderController
);
router.get(
  "/shipping-order/",
  shippingOrderControllers.getAllShippingOrdersController
);
router.get(
  "/shipping-order/:orderId/",
  shippingOrderControllers.getSingleShippingOrderController
);
router.patch(
  "/shipping-order/:orderId/",
  shippingOrderControllers.updateSingleShippingOrderController
);
router.post(
  "/shipping-order/:shippingOrderId/return-request/:orderId/",
  authMiddleware,
  shippingOrderControllers.requestReturnController
);
router.post(
  "/shipping-order/:shippingOrderId/return-handle/",
  authMiddleware,
  shippingOrderControllers.handleReturnRequestController
);
router.patch(
  "/shipping-order/:orderId/status/",
  shippingOrderControllers.updateShippingStatusController
);
router.patch(
  "/shipping-order/:orderId/assign-slot/",
  shippingOrderControllers.assignShippingSlotController
);
router.delete(
  "/shipping-order/:orderId/",
  shippingOrderControllers.deleteSingleShippingOrderController
);
router.post(
  "/shipping-order/bulk-delete/",
  shippingOrderControllers.deleteManyShippingOrdersController
);

router.get(
  "/shipping-order/slot-orders/:slotId/",
  shippingOrderControllers.getOrdersByShippingSlotController
);

export const shippingOrderRoutes = router;
