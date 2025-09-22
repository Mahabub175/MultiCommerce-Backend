import express from "express";
import { roleControllers } from "./role.controller";

const router = express.Router();

router.post("/role/", roleControllers.createRoleController);

router.get("/role/", roleControllers.getAllRoleController);

router.get("/role/:roleId/", roleControllers.getSingleRoleController);

router.patch("/role/:roleId/", roleControllers.updateSingleRoleController);

router.delete("/role/:roleId/", roleControllers.deleteSingleRoleController);

router.post("/role/bulk-delete/", roleControllers.deleteManyRolesController);

export const roleRoutes = router;
