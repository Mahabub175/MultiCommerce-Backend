import express from "express";
import { userControllers } from "./user.controller";
import { uploadService } from "../upload/upload";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = express.Router();

router.post("/user/", userControllers.createUserController);

router.get("/user/", authMiddleware, userControllers.getAllUserController);

router.get("/user/:userId/", userControllers.getSingleUserController);

router.patch(
  "/user/:userId/",
  authMiddleware,
  uploadService.single("profileImage"),
  userControllers.updateSingleUserController
);

router.post(
  "/user/:userId/shipping-address/",
  userControllers.saveAddressController
);

router.patch(
  "/user/:userId/shipping-address/:addressId/",
  userControllers.saveAddressController
);

router.patch(
  "/user/:userId/access/add/",
  userControllers.addUserAccessController
);

router.patch(
  "/user/:userId/access/remove/",
  userControllers.removeUserAccessController
);

router.delete(
  "/user/:userId/shipping-address/:addressId/",
  userControllers.deleteAddressController
);

router.delete("/user/:userId/", userControllers.deleteSingleUserController);

router.post("/user/bulk-delete/", userControllers.deleteManyUsersController);

export const userRoutes = router;
