import { NextFunction, Request, Response } from "express";
import { cartServices } from "./cart.service";

const createCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await cartServices.createCartService(formData);

    res.status(200).json({
      success: true,
      message: "Cart Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["price", "quantity"];

    const result = await cartServices.getAllCartService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Carts Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Cart data
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
      message: "Cart Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleCartBuyUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await cartServices.getSingleCartByUserService(userId);
    res.status(200).json({
      success: true,
      message: "Cart By User Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Cart controller
const updateSingleCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cartId } = req.params;
    const data = req.body;

    const cartData = {
      ...data,
    };

    const result = await cartServices.updateSingleCartService(cartId, cartData);

    res.status(200).json({
      success: true,
      message: "Cart Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single Cart controller
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
      message: "Cart Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Cart controller
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
        message: "Invalid or empty Cart IDs array provided",
        data: null,
      });
    }

    const result = await cartServices.deleteManyCartService(cartIds);

    res.status(200).json({
      success: true,
      message: `Bulk Cart Delete Successful! Deleted ${result.deletedCount} Carts.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const cartControllers = {
  createCartController,
  getAllCartController,
  getSingleCartController,
  getSingleCartBuyUserController,
  updateSingleCartController,
  deleteSingleCartController,
  deleteManyCartController,
};
