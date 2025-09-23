import express from "express";
import { attributeControllers } from "./attribute.controller";
import { uploadService } from "../upload/upload";

const router = express.Router();

router.post(
  "/attribute/",
  uploadService.none(),
  attributeControllers.createAttributeController
);

router.get("/attribute/", attributeControllers.getAllAttributeController);

router.get(
  "/attribute/:attributeId/",
  attributeControllers.getSingleAttributeController
);

router.patch(
  "/attribute/:attributeId/",
  uploadService.none(),
  attributeControllers.updateSingleAttributeController
);

router.delete(
  "/attribute/:attributeId/",
  attributeControllers.deleteSingleAttributeController
);

router.post(
  "/attribute/bulk-delete/",
  attributeControllers.deleteManyAttributesController
);

export const attributeRoutes = router;
