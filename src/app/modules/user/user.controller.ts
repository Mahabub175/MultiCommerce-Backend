import { NextFunction, Request, Response } from "express";
import { userServices } from "./user.service";
import { hashPassword } from "../../utils/passwordUtils";
import { IUser } from "./user.interface";
import { authServices } from "../auth/auth.service";

const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as IUser;

    const filePath = req.file ? req.file.path : undefined;
    const hashedPassword = await hashPassword(data.password);

    const formData = {
      ...data,
      password: hashedPassword,
      attachment: filePath,
    };

    const createdUser = await userServices.createUserService(formData);

    const loginPayload = {
      id: createdUser.email || createdUser.phoneNumber || createdUser.userName,
      password: data.password,
    };

    const loginResult = await authServices.loginUserService(loginPayload);

    res.status(200).json({
      success: true,
      message: "User Created & Logged In Successfully",
      data: {
        login: loginResult,
        user: createdUser,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;

    const searchText = req.query.searchText as string | undefined;
    const searchFields = ["name", "email", "number", "address"];

    const result = await userServices.getAllUserService(
      req.user as any,
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Users Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single user data
const getSingleUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const result = await userServices.getSingleUserService(userId);
    res.status(200).json({
      success: true,
      message: "User Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single user controller
export const updateSingleUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const userData = {
      ...data,
      profileImage: filePath,
    };

    const result = await userServices.updateSingleUserService(
      userId,
      userData,
      req.user as any
    );

    res.status(200).json({
      success: true,
      message: "User Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const saveAddressController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, addressId } = req.params;
    const payload = req.body;

    const result = await userServices.addOrUpdateAddressService(
      userId,
      addressId,
      payload
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const deleteAddressController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, addressId } = req.params;

    const result = await userServices.deleteAddressService(userId, addressId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

//Delete single user controller
const deleteSingleUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    await userServices.deleteSingleUserService(userId);
    res.status(200).json({
      success: true,
      message: "User Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many user controller
const deleteManyUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userIds = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty user IDs array provided",
        data: null,
      });
    }

    const result = await userServices.deleteManyUsersService(userIds);

    res.status(200).json({
      success: true,
      message: `Bulk user Delete Successful! Deleted ${result.deletedCount} users.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const addUserAccessController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    const accessList = req.body;

    if (!Array.isArray(accessList)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of access objects",
      });
    }

    const result = await userServices.addUserAccessService(userId, accessList);

    res.status(200).json({
      success: true,
      message: "Access permissions added successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const removeUserAccessController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    const accessList = req.body;

    if (!Array.isArray(accessList)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of access objects",
      });
    }

    const result = await userServices.removeUserAccessService(
      userId,
      accessList
    );

    res.status(200).json({
      success: true,
      message: "Access permissions removed successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const userControllers = {
  createUserController,
  getAllUserController,
  getSingleUserController,
  updateSingleUserController,
  saveAddressController,
  deleteAddressController,
  deleteSingleUserController,
  deleteManyUsersController,
  addUserAccessController,
  removeUserAccessController,
};
