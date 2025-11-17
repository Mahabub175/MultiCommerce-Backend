import { NextFunction, Request, Response } from "express";
import { orderServices } from "./order.service";

const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const result = await orderServices.createOrderService(data);

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
    const { page, limit, searchText } = req.query;
    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;
    const searchFields = ["orderId", "status", "paymentMethod"];

    const result = await orderServices.getAllOrderService(
      pageNumber,
      pageSize,
      searchText as string,
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

const addItemToOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const newItem = req.body;
    const result = await orderServices.addItemToOrderService(orderId, newItem);

    res.status(200).json({
      success: true,
      message: "Item added to order successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateOrderItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, itemId } = req.params;
    const updatedItem = req.body;
    const result = await orderServices.updateOrderItemService(
      orderId,
      itemId,
      updatedItem
    );

    res.status(200).json({
      success: true,
      message: "Order item updated successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteOrderItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, itemId } = req.params;
    const result = await orderServices.deleteOrderItemService(orderId, itemId);

    res.status(200).json({
      success: true,
      message: "Order item deleted successfully!",
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
    const result = await orderServices.assignShippingSlotService(
      orderId,
      slotId
    );

    res.status(200).json({
      success: true,
      message: "Shipping slot assigned successfully!",
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
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided to update",
      });
    }

    const result = await orderServices.updateShippingStatusService(
      orderId,
      updates
    );

    res.status(200).json({
      success: true,
      message: "Shipping status updated successfully!",
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
    const { orderId } = req.params;
    const returnRequests = req.body;

    const result = await orderServices.requestReturnService(
      orderId,
      returnRequests
    );

    res.status(200).json({
      success: true,
      message: "Return requests submitted successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const handleReturnRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const returnDecisions = req.body;
    const result = await orderServices.handleReturnRequestService(
      orderId,
      returnDecisions
    );

    res.status(200).json({
      success: true,
      message: "Return requests processed successfully!",
      data: result,
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
  addItemToOrderController,
  updateOrderItemController,
  deleteOrderItemController,
  assignShippingSlotController,
  updateShippingStatusController,
  requestReturnController,
  handleReturnRequestController,
};
