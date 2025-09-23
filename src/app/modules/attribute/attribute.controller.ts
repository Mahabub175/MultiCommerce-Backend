import { NextFunction, Request, Response } from "express";
import { attributeServices } from "./attribute.service";

const createAttributeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await attributeServices.createAttributeService(formData);

    res.status(200).json({
      success: true,
      message: "Attribute Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllAttributeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name", "options"];

    const result = await attributeServices.getAllAttributeService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Attributes Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Attribute data
const getSingleAttributeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attributeId } = req.params;
    const result = await attributeServices.getSingleAttributeService(
      attributeId
    );
    res.status(200).json({
      success: true,
      message: "Attribute Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Attribute controller
const updateSingleAttributeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attributeId } = req.params;
    const data = req.body;

    const attributeData = {
      ...data,
    };

    const result = await attributeServices.updateSingleAttributeService(
      attributeId,
      attributeData
    );

    res.status(200).json({
      success: true,
      message: "Attribute Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single Attribute controller
const deleteSingleAttributeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attributeId } = req.params;
    await attributeServices.deleteSingleAttributeService(attributeId);
    res.status(200).json({
      success: true,
      message: "Attribute Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Attribute controller
const deleteManyAttributesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const attributeIds = req.body;

    if (!Array.isArray(attributeIds) || attributeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Attribute IDs array provided",
        data: null,
      });
    }

    const result = await attributeServices.deleteManyAttributesService(
      attributeIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk Attribute Delete Successful! Deleted ${result.deletedCount} Attributes.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const attributeControllers = {
  createAttributeController,
  getAllAttributeController,
  getSingleAttributeController,
  updateSingleAttributeController,
  deleteSingleAttributeController,
  deleteManyAttributesController,
};
