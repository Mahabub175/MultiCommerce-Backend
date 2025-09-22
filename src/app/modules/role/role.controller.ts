import { NextFunction, Request, Response } from "express";
import { roleServices } from "./role.service";

const createRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await roleServices.createRoleService(formData);

    res.status(200).json({
      success: true,
      message: "Role Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["email"];

    const result = await roleServices.getAllRoleService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Roles Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Role data
const getSingleRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roleId } = req.params;
    const result = await roleServices.getSingleRoleService(roleId);
    res.status(200).json({
      success: true,
      message: "Role Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Role controller
const updateSingleRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roleId } = req.params;
    const data = req.body;

    const roleData = {
      ...data,
    };

    const result = await roleServices.updateSingleRoleService(roleId, roleData);

    res.status(200).json({
      success: true,
      message: "Role Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single Role controller
const deleteSingleRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roleId } = req.params;
    await roleServices.deleteSingleRoleService(roleId);
    res.status(200).json({
      success: true,
      message: "Role Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Role controller
const deleteManyRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roleIds = req.body;

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Role IDs array provided",
        data: null,
      });
    }

    const result = await roleServices.deleteManyRoleService(roleIds);

    res.status(200).json({
      success: true,
      message: `Bulk Role Delete Successful! Deleted ${result.deletedCount} Role.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const roleControllers = {
  createRoleController,
  getAllRoleController,
  getSingleRoleController,
  updateSingleRoleController,
  deleteSingleRoleController,
  deleteManyRolesController,
};
