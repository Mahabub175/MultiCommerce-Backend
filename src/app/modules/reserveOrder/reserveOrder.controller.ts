import { NextFunction, Request, Response } from "express";
import { reserveOrderServices } from "./reserveOrder.service";

const createReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    if (
      !data.products ||
      !Array.isArray(data.products) ||
      data.products.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Products array is required.",
      });
    }

    const result = await reserveOrderServices.createReserveOrderService(data);

    res.status(200).json({
      success: true,
      message: "ReserveOrder created successfully",
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
    const { page, limit, searchText } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchFields = ["products.price", "products.quantity"];

    const result = await reserveOrderServices.getAllReserveOrderService(
      pageNumber,
      pageSize,
      searchText as string | undefined,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "ReserveOrders fetched successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

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
      message: "ReserveOrder fetched successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleReserveOrderByUserController = async (
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
      message: "ReserveOrder by user fetched successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateSingleReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reserveOrderId } = req.params;
    const data = req.body;

    // if (!data.sku) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "SKU is required to update a product in the order.",
    //   });
    // }

    const result = await reserveOrderServices.updateSingleReserveOrderService(
      reserveOrderId,
      data
    );

    res.status(200).json({
      success: true,
      message: "ReserveOrder updated successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateReserveOrderProductQuantityController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reserveOrderId, productId, sku } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== "number") {
      return res.status(400).json({
        success: false,
        message: "Quantity (number) is required in the body.",
      });
    }

    const updatedReserveOrder =
      await reserveOrderServices.updateReserveOrderProductQuantityService(
        reserveOrderId,
        productId,
        sku,
        quantity
      );

    res.status(200).json({
      success: true,
      message: "ReserveOrder product quantity updated successfully",
      data: updatedReserveOrder,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteProductsFromReserveOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reserveOrderId } = req.params;
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of products required!",
      });
    }

    const skus = products
      .map((p) => p.sku)
      .filter((sku): sku is string => !!sku);

    const productIds = products
      .map((p) => p._id)
      .filter((id): id is string => !!id);

    if (skus.length === 0 && productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Each product must include at least a _id or SKU.",
      });
    }

    const result =
      await reserveOrderServices.deleteProductsFromReserveOrderService(
        reserveOrderId,
        { skus, productIds }
      );

    res.status(200).json({
      success: true,
      message: "Selected products removed from ReserveOrder successfully.",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

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
      message: "ReserveOrder deleted successfully!",
    });
  } catch (error: any) {
    next(error);
  }
};

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
      });
    }

    const result = await reserveOrderServices.deleteManyReserveOrderService(
      reserveOrderIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk ReserveOrder delete successful! Deleted ${result.deletedCount} orders.`,
    });
  } catch (error: any) {
    next(error);
  }
};

export const reserveOrderControllers = {
  createReserveOrderController,
  getAllReserveOrderController,
  getSingleReserveOrderController,
  getSingleReserveOrderByUserController,
  updateSingleReserveOrderController,
  updateReserveOrderProductQuantityController,
  deleteProductsFromReserveOrderController,
  deleteSingleReserveOrderController,
  deleteManyReserveOrderController,
};
