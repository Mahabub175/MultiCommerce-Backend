import express from "express";
import { authControllers } from "./auth.controller";

const router = express.Router();

router.post("/auth/send-otp", authControllers.sendUserOtpController);
router.post("/auth/send-email", authControllers.sendEmailController);
router.post("/auth/login", authControllers.loginUserController);
router.patch(
  "/auth/change-password/:id",
  authControllers.changeUserPasswordController
);
router.post(
  "/auth/forgot-password",
  authControllers.forgotUserPasswordController
);
router.post(
  "/auth/reset-password",
  authControllers.resetUserPasswordController
);

export const authRoutes = router;
