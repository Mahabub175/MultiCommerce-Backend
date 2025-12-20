import express from "express";
import { shippingAreaControllers } from "./shippingArea.controller";

const router = express.Router();

router.post("/shipping-area/", shippingAreaControllers.createShippingAreaController);

router.get("/shipping-area/", shippingAreaControllers.getAllShippingAreasController);

router.get("/shipping-area/default/", shippingAreaControllers.getDefaultShippingAreaController);

router.get("/shipping-area/match/", shippingAreaControllers.findMatchingShippingAreaController);

router.get("/shipping-area/cost/", shippingAreaControllers.getShippingAreaCostController);

router.get("/shipping-area/:areaId/", shippingAreaControllers.getSingleShippingAreaController);

router.patch("/shipping-area/:areaId/", shippingAreaControllers.updateSingleShippingAreaController);

router.delete("/shipping-area/:areaId/", shippingAreaControllers.deleteSingleShippingAreaController);

router.post("/shipping-area/bulk-delete/", shippingAreaControllers.deleteManyShippingAreasController);

export const shippingAreaRoutes = router;
