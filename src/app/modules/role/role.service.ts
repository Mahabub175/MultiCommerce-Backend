import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { IRole } from "./role.interface";
import { roleModel } from "./role.model";
import { productModel } from "../product/product.model";

//Create a role into database
export const createRoleService = async (roleData: IRole, filePath?: string) => {
  const dataToSave = { ...roleData, filePath };

  const newRole = await roleModel.create(dataToSave);

  const roleDiscountObject = {
    role: newRole._id,
    discountType: newRole.discountType,
    discountValue: newRole.discountValue,
    discountedPrice: 0, // will be recalculated in product pre-save hook
  };

  await productModel.updateMany(
    {},
    { $addToSet: { roleDiscounts: roleDiscountObject } }
  );

  return newRole;
};

// Get all role with optional pagination
const getAllRoleService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = roleModel.find();

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await roleModel.find().sort({ createdAt: -1 }).exec();

    return {
      results,
    };
  }
};

//Get single role
const getSingleRoleService = async (roleId: number | string) => {
  const queryId =
    typeof roleId === "string" ? new mongoose.Types.ObjectId(roleId) : roleId;

  const result = await roleModel.findById(queryId).exec();

  if (!result) {
    throw new Error("Role not found");
  }

  return result;
};

//Update single role
export const updateSingleRoleService = async (
  roleId: string | number,
  roleData: IRole
) => {
  const queryId =
    typeof roleId === "string" ? new mongoose.Types.ObjectId(roleId) : roleId;

  const updatedRole = await roleModel
    .findByIdAndUpdate(
      queryId,
      { $set: roleData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!updatedRole) {
    throw new Error("Role not found");
  }

  await productModel.updateMany(
    { "roleDiscounts.role": updatedRole._id },
    {
      $set: {
        "roleDiscounts.$[elem].discountType": updatedRole.discountType,
        "roleDiscounts.$[elem].discountValue": updatedRole.discountValue,
      },
    },
    {
      arrayFilters: [{ "elem.role": updatedRole._id }],
    }
  );

  const affectedProducts = await productModel.find({
    "roleDiscounts.role": updatedRole._id,
  });
  for (const product of affectedProducts) {
    await product.save();
  }

  return updatedRole;
};

//Delete single role
const deleteSingleRoleService = async (roleId: string | number) => {
  const queryId =
    typeof roleId === "string" ? new mongoose.Types.ObjectId(roleId) : roleId;

  const result = await roleModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Role not found");
  }

  return result;
};

//Delete many role
const deleteManyRoleService = async (roleIds: (string | number)[]) => {
  const queryIds = roleIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await roleModel.deleteMany({ _id: { $in: queryIds } }).exec();

  return result;
};

export const roleServices = {
  createRoleService,
  getAllRoleService,
  getSingleRoleService,
  updateSingleRoleService,
  deleteSingleRoleService,
  deleteManyRoleService,
};
