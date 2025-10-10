import { NextFunction, Request, Response } from "express";
import { orderServices } from "./order.service";

const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const formData = { ...data };

    const result = await orderServices.createOrderService(formData);

    res.status(200).json({
      success: true,
      message: "Order Created Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;
    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["orderId", "status", "paymentMethod"];

    const result = await orderServices.getAllOrderService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Orders Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const result = await orderServices.getSingleOrderService(orderId);

    res.status(200).json({
      success: true,
      message: "Order Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateSingleOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const data = req.body;

    const result = await orderServices.updateSingleOrderService(orderId, data);

    res.status(200).json({
      success: true,
      message: "Order Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteSingleOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    await orderServices.deleteSingleOrderService(orderId);

    res.status(200).json({
      success: true,
      message: "Order Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteManyOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderIds = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Order IDs array provided",
        data: null,
      });
    }

    const result = await orderServices.deleteManyOrderService(orderIds);

    res.status(200).json({
      success: true,
      message: `Bulk Order Delete Successful! Deleted ${result.deletedCount} orders.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const orderControllers = {
  createOrderController,
  getAllOrderController,
  getSingleOrderController,
  updateSingleOrderController,
  deleteSingleOrderController,
  deleteManyOrderController,
};
