import { NextFunction, Request, Response } from "express";
import { shippingSlotServices } from "./shippingSlot.service";

const createShippingSlotController = async (
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

    const result = await shippingSlotServices.createShippingSlotService(
      formData
    );
    res.status(200).json({
      success: true,
      message: "Shipping Slot Created Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllShippingSlotsController = async (
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
    const result = await shippingSlotServices.getAllShippingSlotsService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );
    res.status(200).json({
      success: true,
      message: "Shipping Slots Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleShippingSlotController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    const result = await shippingSlotServices.getSingleShippingSlotService(
      slotId
    );
    res.status(200).json({
      success: true,
      message: "Shipping Slot Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateShippingSlotController = async (
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

    const result = await shippingSlotServices.updateShippingSlotService(
      slotId,
      formData
    );
    res.status(200).json({
      success: true,
      message: "Shipping Slot Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteSingleShippingSlotController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    await shippingSlotServices.deleteSingleShippingSlotService(slotId);
    res.status(200).json({
      success: true,
      message: "Shipping Slot Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteManyShippingSlotsController = async (
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
    const result = await shippingSlotServices.deleteManyShippingSlotService(
      slotIds
    );
    res.status(200).json({
      success: true,
      message: `Bulk Shipping Slot Delete Successful! Deleted ${result.deletedCount} slots.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const shippingSlotControllers = {
  createShippingSlotController,
  getAllShippingSlotsController,
  getSingleShippingSlotController,
  updateShippingSlotController,
  deleteSingleShippingSlotController,
  deleteManyShippingSlotsController,
};
