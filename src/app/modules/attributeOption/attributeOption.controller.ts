import { NextFunction, Request, Response } from "express";
import { attributeOptionServices } from "./attributeOption.service";

const createAttributeOptionController = async (
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

    const result = await attributeOptionServices.createAttributeOptionService(
      formData
    );

    res.status(200).json({
      success: true,
      message: "Attribute Option Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllAttributeOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name", "label"];

    const result = await attributeOptionServices.getAllAttributeOptionService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Attribute Options Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single AttributeOption data
const getSingleAttributeOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attributeOptionId } = req.params;
    const result =
      await attributeOptionServices.getSingleAttributeOptionService(
        attributeOptionId
      );
    res.status(200).json({
      success: true,
      message: "Attribute Option Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single AttributeOption controller
const updateSingleAttributeOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attributeOptionId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const attributeOptionData = {
      ...data,
      attachment: filePath,
    };

    const result =
      await attributeOptionServices.updateSingleAttributeOptionService(
        attributeOptionId,
        attributeOptionData
      );

    res.status(200).json({
      success: true,
      message: "Attribute Option Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single AttributeOption controller
const deleteSingleAttributeOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attributeOptionId } = req.params;
    await attributeOptionServices.deleteSingleAttributeOptionService(
      attributeOptionId
    );
    res.status(200).json({
      success: true,
      message: "Attribute Option Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many AttributeOption controller
const deleteManyAttributeOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const attributeOptionIds = req.body;

    if (!Array.isArray(attributeOptionIds) || attributeOptionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Attribute Option IDs array provided",
        data: null,
      });
    }

    const result =
      await attributeOptionServices.deleteManyAttributeOptionsService(
        attributeOptionIds
      );

    res.status(200).json({
      success: true,
      message: `Bulk Attribute Option Delete Successful! Deleted ${result.deletedCount} AttributeOptions.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const attributeOptionControllers = {
  createAttributeOptionController,
  getAllAttributeOptionController,
  getSingleAttributeOptionController,
  updateSingleAttributeOptionController,
  deleteSingleAttributeOptionController,
  deleteManyAttributeOptionsController,
};
