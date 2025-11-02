import { NextFunction, Request, Response } from "express";
import { reviewServices } from "./review.service";

const addReviewToProductController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const data = req.body;

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await reviewServices.addReviewToProductService(
      productId,
      formData
    );

    res.status(200).json({
      success: true,
      message: `Review Added Successfully`,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["comment", "rating"];

    const result = await reviewServices.getAllReviewsService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Reviews Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewsByUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;
    const { userId } = req.params;

    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["comment", "rating"];

    const result = await reviewServices.getReviewsByUserService(
      userId,
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Reviews By User Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;
    const result = await reviewServices.getSingleReviewService(reviewId);
    res.status(200).json({
      success: true,
      message: "Single Review Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateProductReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, reviewId } = req.params;
    const data = req.body;

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await reviewServices.updateProductReviewService(
      productId,
      reviewId,
      formData
    );

    res.status(200).json({
      success: true,
      message: `Review Updated Successfully`,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteProductReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, reviewId } = req.params;

    const result = await reviewServices.deleteProductReviewService(
      productId,
      reviewId
    );

    res.status(200).json({
      success: true,
      message: `Review Deleted Successfully`,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const reviewControllers = {
  addReviewToProductController,
  getAllReviewsController,
  getReviewsByUserController,
  getSingleReviewController,
  updateProductReviewController,
  deleteProductReviewController,
};
