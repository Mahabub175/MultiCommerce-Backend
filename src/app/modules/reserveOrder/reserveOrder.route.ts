import express from "express";
import { reserveOrderControllers } from "./reserveOrder.controller";

const router = express.Router();

router.post(
  "/reserve-order/",
  reserveOrderControllers.createReserveOrderController
);

router.get(
  "/reserve-order/",
  reserveOrderControllers.getAllReserveOrderController
);

router.get(
  "/reserve-order/:reserveOrderId/",
  reserveOrderControllers.getSingleReserveOrderController
);

router.get(
  "/reserve-order/user/:userId/",
  reserveOrderControllers.getSingleReserveOrderByUserController
);

router.patch(
  "/reserve-order/:reserveOrderId/",
  reserveOrderControllers.updateSingleReserveOrderController
);

router.patch(
  "/reserve-order/:reserveOrderId/product/:productId/:sku/update-quantity/",
  reserveOrderControllers.updateReserveOrderProductQuantityController
);

router.delete(
  "/reserve-order/:reserveOrderId/delete-products/",
  reserveOrderControllers.deleteProductsFromReserveOrderController
);

router.delete(
  "/reserve-order/:reserveOrderId/",
  reserveOrderControllers.deleteSingleReserveOrderController
);

router.post(
  "/reserve-order/bulk-delete/",
  reserveOrderControllers.deleteManyReserveOrderController
);

export const reserveOrderRoutes = router;
