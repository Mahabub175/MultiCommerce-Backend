import { NextFunction, Request, Response } from "express";
import { categoryServices } from "./category.service";
import { generateSlug } from "../../utils/generateSlug";

const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const slug = data.slug ? data.slug : generateSlug(data.name);

    const formData = {
      ...data,
      slug,
      attachment: filePath,
    };

    const result = await categoryServices.createCategoryService(formData);

    res.status(200).json({
      success: true,
      message: "Category Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name", "slug", "level"];

    const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;

    const result = await categoryServices.getAllCategoryService(
      pageNumber,
      pageSize,
      searchText,
      searchFields,
      sortOrder
    );

    res.status(200).json({
      success: true,
      message: "Categories Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;
    const result = await categoryServices.getSingleCategoryService(categoryId);

    res.status(200).json({
      success: true,
      message: "Category Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateSingleCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const slug = data.slug ?? data.slug;

    const categoryData = {
      ...data,
      slug,
      attachment: filePath,
    };

    const result = await categoryServices.updateSingleCategoryService(
      categoryId,
      categoryData
    );

    res.status(200).json({
      success: true,
      message: "Category Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteSingleCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;

    await categoryServices.deleteSingleCategoryService(categoryId);

    res.status(200).json({
      success: true,
      message: "Category Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteManyCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryIds = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty category IDs array provided",
        data: null,
      });
    }

    const result = await categoryServices.deleteManyCategoriesService(
      categoryIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk Category Delete Successful! Deleted ${result.deletedCount} categories.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const categoryControllers = {
  createCategoryController,
  getAllCategoryController,
  getSingleCategoryController,
  updateSingleCategoryController,
  deleteSingleCategoryController,
  deleteManyCategoriesController,
};
