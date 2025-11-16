import { NextFunction, Request, Response } from "express";
import { shippingOrderServices } from "./shippingOrder.service";

const createShippingOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const result = await shippingOrderServices.createShippingOrderService(data);
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
    const result = await shippingOrderServices.getAllShippingOrdersService(
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
    const result = await shippingOrderServices.getSingleShippingOrderService(
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
    const result = await shippingOrderServices.updateSingleShippingOrderService(
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

const requestReturnController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shippingOrderId } = req.params;
    const returnRequests = req.body;

    const result = await shippingOrderServices.requestReturnService(
      shippingOrderId,
      returnRequests
    );

    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

const handleReturnRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shippingOrderId } = req.params;
    const returnDecisions = req.body;

    const result = await shippingOrderServices.handleReturnRequestService(
      shippingOrderId,
      returnDecisions
    );

    res.json({ success: true, result });
  } catch (err) {
    next(err);
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
    const result = await shippingOrderServices.updateShippingStatusService(
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
    const result = await shippingOrderServices.assignShippingSlotService(
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

const getOrdersByShippingSlotController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    const results = await shippingOrderServices.getOrdersByShippingSlotService(
      slotId
    );

    res.status(200).json({
      success: true,
      message: `Shipping Orders for Slot ${slotId} fetched successfully!`,
      data: results,
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
    await shippingOrderServices.deleteSingleShippingOrderService(orderId);
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
    const result = await shippingOrderServices.deleteManyShippingOrderService(
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

export const shippingOrderControllers = {
  createShippingOrderController,
  getAllShippingOrdersController,
  getSingleShippingOrderController,
  updateSingleShippingOrderController,
  requestReturnController,
  handleReturnRequestController,
  updateShippingStatusController,
  assignShippingSlotController,
  deleteSingleShippingOrderController,
  deleteManyShippingOrdersController,
  getOrdersByShippingSlotController,
};
