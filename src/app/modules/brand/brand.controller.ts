import { NextFunction, Request, Response } from "express";
import { brandServices } from "./brand.service";

const createBrandController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await brandServices.createBrandService(formData);

    res.status(200).json({
      success: true,
      message: "Brand Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllBrandController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name", "description"];

    const result = await brandServices.getAllBrandService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Brands Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single brand data
const getSingleBrandController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId } = req.params;
    const result = await brandServices.getSingleBrandService(brandId);
    res.status(200).json({
      success: true,
      message: "Brand Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single brand controller
const updateSingleBrandController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const brandData = {
      ...data,
      attachment: filePath,
    };

    const result = await brandServices.updateSingleBrandService(
      brandId,
      brandData
    );

    res.status(200).json({
      success: true,
      message: "Brand Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single brand controller
const deleteSingleBrandController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brandId } = req.params;
    await brandServices.deleteSingleBrandService(brandId);
    res.status(200).json({
      success: true,
      message: "Brand Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many brand controller
const deleteManyBrandsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const brandIds = req.body;

    if (!Array.isArray(brandIds) || brandIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty brand IDs array provided",
        data: null,
      });
    }

    const result = await brandServices.deleteManyBrandsService(brandIds);

    res.status(200).json({
      success: true,
      message: `Bulk brand Delete Successful! Deleted ${result.deletedCount} brands.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const brandControllers = {
  createBrandController,
  getAllBrandController,
  getSingleBrandController,
  updateSingleBrandController,
  deleteSingleBrandController,
  deleteManyBrandsController,
};
