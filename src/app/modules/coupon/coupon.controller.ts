import { NextFunction, Request, Response } from "express";
import { couponServices } from "./coupon.service";

const createCouponController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await couponServices.createCouponService(formData);

    res.status(200).json({
      success: true,
      message: "Coupon Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllCouponController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name", "code"];

    const result = await couponServices.getAllCouponService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Coupons Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Coupon data
const getSingleCouponController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponId } = req.params;
    const result = await couponServices.getSingleCouponService(couponId);
    res.status(200).json({
      success: true,
      message: "Coupon Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleCouponByCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponCode } = req.params;
    const result = await couponServices.getSingleCouponByCodeService(
      couponCode
    );
    res.status(200).json({
      success: true,
      message: "Coupon By Code Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Coupon controller
const updateSingleCouponController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const couponData = {
      ...data,
      attachment: filePath,
    };

    const result = await couponServices.updateSingleCouponService(
      couponId,
      couponData
    );

    res.status(200).json({
      success: true,
      message: "Coupon Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single Coupon controller
const deleteSingleCouponController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponId } = req.params;
    await couponServices.deleteSingleCouponService(couponId);
    res.status(200).json({
      success: true,
      message: "Coupon Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Coupon controller
const deleteManyCouponController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const couponIds = req.body;

    if (!Array.isArray(couponIds) || couponIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Coupon IDs array provided",
        data: null,
      });
    }

    const result = await couponServices.deleteManyCouponService(couponIds);

    res.status(200).json({
      success: true,
      message: `Bulk Coupon Delete Successful! Deleted ${result.deletedCount} Coupon.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const couponControllers = {
  createCouponController,
  getAllCouponController,
  getSingleCouponController,
  getSingleCouponByCodeController,
  updateSingleCouponController,
  deleteSingleCouponController,
  deleteManyCouponController,
};
