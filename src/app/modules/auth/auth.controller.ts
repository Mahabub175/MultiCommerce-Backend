import { NextFunction, Request, Response } from "express";
import { authServices } from "./auth.service";

const sendUserOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { number } = req.body;
    const result = await authServices.sendUserOtpService(number);
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const loginUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = req.body;
    const result = await authServices.loginUserService(userData);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const changeUserPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    const result = await authServices.changeUserPasswordService(
      userId,
      userData
    );
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const forgotUserPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { number } = req.body;
    const result = await authServices.forgotUserPasswordService(number);
    res.status(200).json({
      success: true,
      message: "OTP sent for password reset",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const resetUserPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    await authServices.resetUserPasswordService(payload);
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

export const authControllers = {
  sendUserOtpController,
  loginUserController,
  changeUserPasswordController,
  forgotUserPasswordController,
  resetUserPasswordController,
};
