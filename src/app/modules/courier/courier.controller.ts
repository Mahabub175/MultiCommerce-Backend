import { NextFunction, Request, Response } from "express";
import { courierServices } from "./courier.service";

const createCourierController = async (
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

    const result = await courierServices.createCourierService(formData);
    res.status(200).json({
      success: true,
      message: "Courier Created Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllCouriersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;
    const searchText = req.query.searchText as string | undefined;
    const searchFields = ["slotName", "status"];
    const result = await courierServices.getAllCouriersService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );
    res.status(200).json({
      success: true,
      message: "Couriers Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleCourierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    const result = await courierServices.getSingleCourierService(slotId);
    res.status(200).json({
      success: true,
      message: "Courier Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateCourierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    const data = req.body;

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await courierServices.updateCourierService(slotId, formData);
    res.status(200).json({
      success: true,
      message: "Courier Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteSingleCourierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    await courierServices.deleteSingleCourierService(slotId);
    res.status(200).json({
      success: true,
      message: "Courier Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteManyCouriersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slotIds = req.body;
    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Slot IDs array provided",
        data: null,
      });
    }
    const result = await courierServices.deleteManyCourierService(slotIds);
    res.status(200).json({
      success: true,
      message: `Bulk Courier Delete Successful! Deleted ${result.deletedCount} slots.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const courierControllers = {
  createCourierController,
  getAllCouriersController,
  getSingleCourierController,
  updateCourierController,
  deleteSingleCourierController,
  deleteManyCouriersController,
};
