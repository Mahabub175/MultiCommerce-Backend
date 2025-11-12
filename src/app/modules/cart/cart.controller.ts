import { NextFunction, Request, Response } from "express";
import { cartServices } from "./cart.service";

// Create or update cart (merge products if exists)
const createCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required in cart data.",
      });
    }

    const result = await cartServices.createCartService(data);

    res.status(200).json({
      success: true,
      message: "Cart created or updated successfully.",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get all carts (admin use)
const getAllCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, searchText } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;
    const searchFields = ["products.price", "products.quantity"];

    const result = await cartServices.getAllCartService(
      pageNumber,
      pageSize,
      searchText as string | undefined,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Carts fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get single cart by ID
const getSingleCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cartId } = req.params;
    const result = await cartServices.getSingleCartService(cartId);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully.",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get cart by user/deviceId
const getSingleCartByUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await cartServices.getSingleCartByUserService(userId);

    res.status(200).json({
      success: true,
      message: "Cart by user fetched successfully.",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

// Update a product inside a cart
const updateSingleCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cartId } = req.params;
    const updatedProduct = req.body; 

    if (!updatedProduct?.sku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required to update a product in the cart.",
      });
    }

    const result = await cartServices.updateSingleCartService(cartId, updatedProduct);

    res.status(200).json({
      success: true,
      message: "Cart product updated successfully.",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

// Remove a single product from a cart
const deleteProductFromCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cartId, sku } = req.params;

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: "SKU parameter is required to delete a product from the cart.",
      });
    }

    const result = await cartServices.deleteProductFromCartService(cartId, sku);

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully.",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete an entire cart
const deleteSingleCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cartId } = req.params;
    await cartServices.deleteSingleCartService(cartId);

    res.status(200).json({
      success: true,
      message: "Cart deleted successfully.",
    });
  } catch (error: any) {
    next(error);
  }
};

// Bulk delete carts
const deleteManyCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cartIds = req.body;

    if (!Array.isArray(cartIds) || cartIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty cart IDs array provided.",
      });
    }

    const result = await cartServices.deleteManyCartService(cartIds);

    res.status(200).json({
      success: true,
      message: `Bulk cart delete successful — deleted ${result.deletedCount} carts.`,
    });
  } catch (error: any) {
    next(error);
  }
};

export const cartControllers = {
  createCartController,
  getAllCartController,
  getSingleCartController,
  getSingleCartByUserController,
  updateSingleCartController,
  deleteProductFromCartController,
  deleteSingleCartController,
  deleteManyCartController,
};
