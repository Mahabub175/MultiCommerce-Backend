import express from "express";
import { orderControllers } from "./order.controller";

const router = express.Router();

router.post("/order/", orderControllers.createOrderController);

router.get("/order/", orderControllers.getAllOrderController);

router.get("/order/:orderId/", orderControllers.getSingleOrderController);

router.patch("/order/:orderId/", orderControllers.updateSingleOrderController);

router.delete("/order/:orderId/", orderControllers.deleteSingleOrderController);

router.post("/order/bulk-delete/", orderControllers.deleteManyOrderController);

router.post(
  "/order/:orderId/items/",
  orderControllers.addItemToOrderController
);

router.patch(
  "/order/:orderId/items/:itemId/",
  orderControllers.updateOrderItemController
);

router.delete(
  "/order/:orderId/items/:itemId/",
  orderControllers.deleteOrderItemController
);

router.patch(
  "/order/:orderId/shipping-slot/:slotId/",
  orderControllers.assignShippingSlotController
);

router.patch(
  "/order/:orderId/items/shipping-status/update/",
  orderControllers.updateShippingStatusController
);

router.post(
  "/order/:orderId/items/return-request/",
  orderControllers.requestReturnController
);

router.patch(
  "/order/:orderId/items/return-decision/update/",
  orderControllers.handleReturnRequestController
);

export const orderRoutes = router;
