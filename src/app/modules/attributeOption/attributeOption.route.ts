import express from "express";
import { uploadService } from "../upload/upload";
import { attributeOptionControllers } from "./attributeOption.controller";

const router = express.Router();

router.post(
  "/attribute-option/",
  uploadService.single("attachment"),
  attributeOptionControllers.createAttributeOptionController
);

router.get(
  "/attribute-option/",
  attributeOptionControllers.getAllAttributeOptionController
);

router.get(
  "/attribute-option/:attributeOptionId/",
  attributeOptionControllers.getSingleAttributeOptionController
);

router.patch(
  "/attribute-option/:attributeOptionId/",
  uploadService.single("attachment"),
  attributeOptionControllers.updateSingleAttributeOptionController
);

router.delete(
  "/attribute-option/:attributeOptionId/",
  attributeOptionControllers.deleteSingleAttributeOptionController
);

router.post(
  "/attribute-option/bulk-delete/",
  attributeOptionControllers.deleteManyAttributeOptionsController
);

export const attributeOptionRoutes = router;
