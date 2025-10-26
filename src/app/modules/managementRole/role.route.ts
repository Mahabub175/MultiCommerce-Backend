import express from "express";
import { managementRoleControllers } from "./managementRole.controller";

const router = express.Router();

router.post(
  "/management-role/",
  managementRoleControllers.createManagementRoleController
);

router.get(
  "/management-role/",
  managementRoleControllers.getAllManagementRoleController
);

router.get(
  "/management-role/:managementRoleId/",
  managementRoleControllers.getSingleManagementRoleController
);

router.patch(
  "/management-role/:managementRoleId/",
  managementRoleControllers.updateSingleManagementRoleController
);

router.delete(
  "/management-role/:managementRoleId/",
  managementRoleControllers.deleteSingleManagementRoleController
);

router.post(
  "/management-role/bulk-delete/",
  managementRoleControllers.deleteManyManagementRolesController
);

export const managementRoleRoutes = router;
