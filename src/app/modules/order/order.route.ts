import express from "express";
import { orderControllers } from "./order.controller";

const router = express.Router();

router.post("/order/", orderControllers.createOrderController);

router.get("/order/", orderControllers.getAllOrderController);

router.get("/order/:orderId/", orderControllers.getSingleOrderController);

router.patch("/order/:orderId/", orderControllers.updateSingleOrderController);

router.delete("/order/:orderId/", orderControllers.deleteSingleOrderController);

router.post("/order/bulk-delete/", orderControllers.deleteManyOrderController);

export const orderRoutes = router;
