import { NextFunction, Request, Response } from "express";
import { shippingServices } from "./shipping.service";

const createShippingSlotController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const result = await shippingServices.createShippingSlotService(data);
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
    const result = await shippingServices.getAllShippingSlotsService(
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
    const result = await shippingServices.getSingleShippingSlotService(slotId);
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
    const result = await shippingServices.updateShippingSlotService(
      slotId,
      data
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
    await shippingServices.deleteSingleShippingSlotService(slotId);
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
    const result = await shippingServices.deleteManyShippingSlotService(
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

const createShippingOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const result = await shippingServices.createShippingOrderService(data);
    res.status(200).json({
      success: true,
      message: "Shipping Order Created Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllShippingOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;
    const searchText = req.query.searchText as string | undefined;
    const searchFields = ["shippingStatus", "status"];
    const result = await shippingServices.getAllShippingOrdersService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );
    res.status(200).json({
      success: true,
      message: "Shipping Orders Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleShippingOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const result = await shippingServices.getSingleShippingOrderService(
      orderId
    );
    res.status(200).json({
      success: true,
      message: "Shipping Order Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateSingleShippingOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const data = req.body;
    const result = await shippingServices.updateSingleShippingOrderService(
      orderId,
      data
    );
    res.status(200).json({
      success: true,
      message: "Shipping Order Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateShippingStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const result = await shippingServices.updateShippingStatusService(
      orderId,
      status
    );
    res.status(200).json({
      success: true,
      message: "Shipping Status Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const assignShippingSlotController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, slotId } = req.params;
    const result = await shippingServices.assignShippingSlotService(
      orderId,
      slotId
    );
    res.status(200).json({
      success: true,
      message: "Shipping Slot Assigned Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteSingleShippingOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    await shippingServices.deleteSingleShippingOrderService(orderId);
    res.status(200).json({
      success: true,
      message: "Shipping Order Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteManyShippingOrdersController = async (
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
    const result = await shippingServices.deleteManyShippingOrderService(
      orderIds
    );
    res.status(200).json({
      success: true,
      message: `Bulk Shipping Order Delete Successful! Deleted ${result.deletedCount} orders.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const shippingControllers = {
  createShippingSlotController,
  getAllShippingSlotsController,
  getSingleShippingSlotController,
  updateShippingSlotController,
  deleteSingleShippingSlotController,
  deleteManyShippingSlotsController,
  createShippingOrderController,
  getAllShippingOrdersController,
  getSingleShippingOrderController,
  updateSingleShippingOrderController,
  updateShippingStatusController,
  assignShippingSlotController,
  deleteSingleShippingOrderController,
  deleteManyShippingOrdersController,
};
