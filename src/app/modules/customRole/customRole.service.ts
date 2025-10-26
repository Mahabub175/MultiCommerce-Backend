import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { ICustomRole } from "./customRole.interface";
import { customRoleModel } from "./customRole.model";
import { productModel } from "../product/product.model";
import { categoryModel } from "../category/category.model";

//Create a customRole into database
export const createCustomRoleService = async (
  customRoleData: ICustomRole,
  filePath?: string
) => {
  const dataToSave = { ...customRoleData, filePath };

  const newCustomRole = await customRoleModel.create(dataToSave);

  if (
    newCustomRole.discountType &&
    typeof newCustomRole.discountValue === "number"
  ) {
    const roleDiscount = {
      role: new mongoose.Types.ObjectId(newCustomRole._id),
      discountType: newCustomRole.discountType,
      discountValue: newCustomRole.discountValue,
      minimumQuantity: newCustomRole.minimumQuantity || 1,
      status: true,
    };

    await productModel.updateMany(
      {},
      {
        $addToSet: {
          globalRoleDiscounts: roleDiscount,
        },
      }
    );

    await categoryModel.updateMany(
      { "roleDiscounts.role": { $ne: newCustomRole._id } },
      {
        $push: {
          roleDiscounts: roleDiscount,
        },
      }
    );
  }

  return newCustomRole;
};

// Get all customRole with optional pagination
const getAllCustomRoleService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = customRoleModel.find();

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await customRoleModel.find().sort({ createdAt: -1 }).exec();

    return {
      results,
    };
  }
};

//Get single customRole
const getSingleCustomRoleService = async (customRoleId: number | string) => {
  const queryId =
    typeof customRoleId === "string"
      ? new mongoose.Types.ObjectId(customRoleId)
      : customRoleId;

  const result = await customRoleModel.findById(queryId).exec();

  if (!result) {
    throw new Error("CustomRole not found");
  }

  return result;
};

//Update single customRole
export const updateSingleCustomRoleService = async (
  customRoleId: string | number,
  customRoleData: ICustomRole
) => {
  const queryId =
    typeof customRoleId === "string"
      ? new mongoose.Types.ObjectId(customRoleId)
      : customRoleId;

  const existingRole = await customRoleModel.findById(queryId);

  if (!existingRole) {
    throw new Error("Custom role not found");
  }

  const updatedCustomRole = await customRoleModel
    .findByIdAndUpdate(
      queryId,
      { $set: customRoleData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!updatedCustomRole) {
    throw new Error("Failed to update custom role");
  }

  const discountData = {
    role: updatedCustomRole._id,
    discountType: updatedCustomRole.discountType,
    discountValue: updatedCustomRole.discountValue,
    minimumQuantity: updatedCustomRole.minimumQuantity,
  };

  if (updatedCustomRole.status === false) {
    await productModel.updateMany(
      {},
      { $pull: { roleDiscounts: { role: updatedCustomRole._id } } }
    );
  } else {
    await productModel.updateMany(
      {
        "roleDiscounts.role": updatedCustomRole._id,
      },
      {
        $set: {
          "roleDiscounts.$.discountType": discountData.discountType,
          "roleDiscounts.$.discountValue": discountData.discountValue,
          "roleDiscounts.$.minimumQuantity": discountData.minimumQuantity,
        },
      }
    );

    await productModel.updateMany(
      {
        "roleDiscounts.role": { $ne: updatedCustomRole._id },
      },
      {
        $push: { roleDiscounts: discountData },
      }
    );
  }

  return updatedCustomRole;
};

//Delete single customRole
const deleteSingleCustomRoleService = async (customRoleId: string | number) => {
  const queryId =
    typeof customRoleId === "string"
      ? new mongoose.Types.ObjectId(customRoleId)
      : customRoleId;

  const result = await customRoleModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("CustomRole not found");
  }

  return result;
};

//Delete many customRole
const deleteManyCustomRoleService = async (
  customRoleIds: (string | number)[]
) => {
  const queryIds = customRoleIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await customRoleModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const customRoleServices = {
  createCustomRoleService,
  getAllCustomRoleService,
  getSingleCustomRoleService,
  updateSingleCustomRoleService,
  deleteSingleCustomRoleService,
  deleteManyCustomRoleService,
};
