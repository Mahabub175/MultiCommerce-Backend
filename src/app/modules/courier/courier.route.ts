import express from "express";
import { courierControllers } from "./courier.controller";
import { uploadService } from "../upload/upload";

const router = express.Router();

router.post(
  "/courier/",
  uploadService.single("attachment"),
  courierControllers.createCourierController
);

router.get("/courier/", courierControllers.getAllCouriersController);

router.get("/courier/:slotId/", courierControllers.getSingleCourierController);

router.patch(
  "/courier/:slotId/",
  uploadService.single("attachment"),
  courierControllers.updateCourierController
);

router.delete(
  "/courier/:slotId/",
  courierControllers.deleteSingleCourierController
);

router.post(
  "/courier/bulk-delete/",
  courierControllers.deleteManyCouriersController
);

export const courierRoutes = router;
