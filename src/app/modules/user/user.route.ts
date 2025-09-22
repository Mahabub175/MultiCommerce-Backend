import express from "express";
import { userControllers } from "./user.controller";
import { uploadService } from "../upload/upload";

const router = express.Router();

router.post("/user/", userControllers.createUserController);

router.get("/user/", userControllers.getAllUserController);

router.get("/user/:userId/", userControllers.getSingleUserController);

router.patch(
  "/user/:userId/",
  uploadService.single("profileImage"),
  userControllers.updateSingleUserController
);

router.delete("/user/:userId/", userControllers.deleteSingleUserController);

router.post("/user/bulk-delete/", userControllers.deleteManyUsersController);

export const userRoutes = router;
