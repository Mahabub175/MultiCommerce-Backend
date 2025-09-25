import { NextFunction, Request, Response } from "express";
import { wishlistServices } from "./wishlist.service";

const createWishlistController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await wishlistServices.createWishlistService(formData);

    res.status(200).json({
      success: true,
      message: "Wishlist Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllWishlistController = async (
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

    const result = await wishlistServices.getAllWishlistService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Wishlists Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Wishlist data
const getSingleWishlistController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wishlistId } = req.params;
    const result = await wishlistServices.getSingleWishlistService(wishlistId);
    res.status(200).json({
      success: true,
      message: "Wishlist Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleWishlistBuyUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await wishlistServices.getSingleWishlistByUserService(
      userId
    );
    res.status(200).json({
      success: true,
      message: "Wishlist By User Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Wishlist controller
const updateSingleWishlistController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wishlistId } = req.params;
    const data = req.body;

    const wishlistData = {
      ...data,
    };

    const result = await wishlistServices.updateSingleWishlistService(
      wishlistId,
      wishlistData
    );

    res.status(200).json({
      success: true,
      message: "Wishlist Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single Wishlist controller
const deleteSingleWishlistController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wishlistId } = req.params;
    await wishlistServices.deleteSingleWishlistService(wishlistId);
    res.status(200).json({
      success: true,
      message: "Wishlist Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Wishlist controller
const deleteManyWishlistController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const wishlistIds = req.body;

    if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Wishlist IDs array provided",
        data: null,
      });
    }

    const result = await wishlistServices.deleteManyWishlistService(
      wishlistIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk Wishlist Delete Successful! Deleted ${result.deletedCount} Wishlists.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const wishlistControllers = {
  createWishlistController,
  getAllWishlistController,
  getSingleWishlistController,
  getSingleWishlistBuyUserController,
  updateSingleWishlistController,
  deleteSingleWishlistController,
  deleteManyWishlistController,
};
