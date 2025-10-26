import express from "express";
import { customRoleControllers } from "./customRole.controller";

const router = express.Router();

router.post("/custom-role/", customRoleControllers.createCustomRoleController);

router.get("/custom-role/", customRoleControllers.getAllCustomRoleController);

router.get(
  "/custom-role/:customRoleId/",
  customRoleControllers.getSingleCustomRoleController
);

router.patch(
  "/custom-role/:customRoleId/",
  customRoleControllers.updateSingleCustomRoleController
);

router.delete(
  "/custom-role/:customRoleId/",
  customRoleControllers.deleteSingleCustomRoleController
);

router.post(
  "/custom-role/bulk-delete/",
  customRoleControllers.deleteManyCustomRolesController
);

export const customRoleRoutes = router;
