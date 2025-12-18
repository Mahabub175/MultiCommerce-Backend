import { NextFunction, Request, Response } from "express";
import { customRoleServices } from "./customRole.service";

const createCustomRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await customRoleServices.createCustomRoleService(formData);

    res.status(200).json({
      success: true,
      message: "CustomRole Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllCustomRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;

    const searchText = req.query.searchText as string | undefined;
    const filter = req.query.filter as string | undefined;

    const searchFields = ["name"];

    const result = await customRoleServices.getAllCustomRoleService(
      pageNumber,
      pageSize,
      searchText,
      filter,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "CustomRoles Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single CustomRole data
const getSingleCustomRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customRoleId } = req.params;
    const result = await customRoleServices.getSingleCustomRoleService(
      customRoleId
    );
    res.status(200).json({
      success: true,
      message: "CustomRole Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single CustomRole controller
const updateSingleCustomRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customRoleId } = req.params;
    const data = req.body;

    const customRoleData = {
      ...data,
    };

    const result = await customRoleServices.updateSingleCustomRoleService(
      customRoleId,
      customRoleData
    );

    res.status(200).json({
      success: true,
      message: "CustomRole Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single CustomRole controller
const deleteSingleCustomRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customRoleId } = req.params;
    await customRoleServices.deleteSingleCustomRoleService(customRoleId);
    res.status(200).json({
      success: true,
      message: "CustomRole Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many CustomRole controller
const deleteManyCustomRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customRoleIds = req.body;

    if (!Array.isArray(customRoleIds) || customRoleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty CustomRole IDs array provided",
        data: null,
      });
    }

    const result = await customRoleServices.deleteManyCustomRoleService(
      customRoleIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk CustomRole Delete Successful! Deleted ${result.deletedCount} CustomRole.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const customRoleControllers = {
  createCustomRoleController,
  getAllCustomRoleController,
  getSingleCustomRoleController,
  updateSingleCustomRoleController,
  deleteSingleCustomRoleController,
  deleteManyCustomRolesController,
};
