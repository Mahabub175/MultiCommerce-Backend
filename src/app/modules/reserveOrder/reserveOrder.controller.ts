import { NextFunction, Request, Response } from "express";
import { reserveOrderServices } from "./reserveOrder.service";

const createReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await reserveOrderServices.createReserveOrderService(
      formData
    );

    res.status(200).json({
      success: true,
      message: "ReserveOrder Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["price", "quantity"];

    const result = await reserveOrderServices.getAllReserveOrderService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "ReserveOrders Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single ReserveOrder data
const getSingleReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reserveOrderId } = req.params;
    const result = await reserveOrderServices.getSingleReserveOrderService(
      reserveOrderId
    );
    res.status(200).json({
      success: true,
      message: "ReserveOrder Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleReserveOrderBuyUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result =
      await reserveOrderServices.getSingleReserveOrderByUserService(userId);
    res.status(200).json({
      success: true,
      message: "ReserveOrder By User Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single ReserveOrder controller
const updateSingleReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reserveOrderId } = req.params;
    const data = req.body;

    const reserveOrderData = {
      ...data,
    };

    const result = await reserveOrderServices.updateSingleReserveOrderService(
      reserveOrderId,
      reserveOrderData
    );

    res.status(200).json({
      success: true,
      message: "ReserveOrder Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single ReserveOrder controller
const deleteSingleReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reserveOrderId } = req.params;
    await reserveOrderServices.deleteSingleReserveOrderService(reserveOrderId);
    res.status(200).json({
      success: true,
      message: "ReserveOrder Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many ReserveOrder controller
const deleteManyReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reserveOrderIds = req.body;

    if (!Array.isArray(reserveOrderIds) || reserveOrderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty ReserveOrder IDs array provided",
        data: null,
      });
    }

    const result = await reserveOrderServices.deleteManyReserveOrderService(
      reserveOrderIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk ReserveOrder Delete Successful! Deleted ${result.deletedCount} ReserveOrders.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const reserveOrderControllers = {
  createReserveOrderController,
  getAllReserveOrderController,
  getSingleReserveOrderController,
  getSingleReserveOrderBuyUserController,
  updateSingleReserveOrderController,
  deleteSingleReserveOrderController,
  deleteManyReserveOrderController,
};
