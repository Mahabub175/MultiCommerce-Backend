import { NextFunction, Request, Response } from "express";
import { managementRoleServices } from "./managementRole.service";

const createManagementRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await managementRoleServices.createManagementRoleService(
      formData
    );

    res.status(200).json({
      success: true,
      message: "ManagementRole Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllManagementRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name"];

    const result = await managementRoleServices.getAllManagementRoleService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "ManagementRoles Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single ManagementRole data
const getSingleManagementRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { managementRoleId } = req.params;
    const result = await managementRoleServices.getSingleManagementRoleService(
      managementRoleId
    );
    res.status(200).json({
      success: true,
      message: "ManagementRole Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single ManagementRole controller
const updateSingleManagementRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { managementRoleId } = req.params;
    const data = req.body;

    const managementRoleData = {
      ...data,
    };

    const result =
      await managementRoleServices.updateSingleManagementRoleService(
        managementRoleId,
        managementRoleData
      );

    res.status(200).json({
      success: true,
      message: "ManagementRole Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single ManagementRole controller
const deleteSingleManagementRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { managementRoleId } = req.params;
    await managementRoleServices.deleteSingleManagementRoleService(
      managementRoleId
    );
    res.status(200).json({
      success: true,
      message: "ManagementRole Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many ManagementRole controller
const deleteManyManagementRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const managementRoleIds = req.body;

    if (!Array.isArray(managementRoleIds) || managementRoleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty ManagementRole IDs array provided",
        data: null,
      });
    }

    const result = await managementRoleServices.deleteManyManagementRoleService(
      managementRoleIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk ManagementRole Delete Successful! Deleted ${result.deletedCount} ManagementRole.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const managementRoleControllers = {
  createManagementRoleController,
  getAllManagementRoleController,
  getSingleManagementRoleController,
  updateSingleManagementRoleController,
  deleteSingleManagementRoleController,
  deleteManyManagementRolesController,
};
