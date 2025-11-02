import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { IManagementRole } from "./managementRole.interface";
import { managementRoleModel } from "./managementRole.model";

//Create a managementRole into database
export const createManagementRoleService = async (
  managementRoleData: IManagementRole,
  filePath?: string
) => {
  const dataToSave = { ...managementRoleData, filePath };

  const newManagementRole = await managementRoleModel.create(dataToSave);

  return newManagementRole;
};

// Get all managementRole with optional pagination
const getAllManagementRoleService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page || limit || searchText) {
    const query = managementRoleModel.find();

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await managementRoleModel.find().sort({ createdAt: -1 }).exec();

    return {
      results,
    };
  }
};

//Get single managementRole
const getSingleManagementRoleService = async (
  managementRoleId: number | string
) => {
  const queryId =
    typeof managementRoleId === "string"
      ? new mongoose.Types.ObjectId(managementRoleId)
      : managementRoleId;

  const result = await managementRoleModel.findById(queryId).exec();

  if (!result) {
    throw new Error("ManagementRole not found");
  }

  return result;
};

//Update single managementRole
export const updateSingleManagementRoleService = async (
  managementRoleId: string | number,
  managementRoleData: IManagementRole
) => {
  const queryId =
    typeof managementRoleId === "string"
      ? new mongoose.Types.ObjectId(managementRoleId)
      : managementRoleId;

  const updatedManagementRole = await managementRoleModel
    .findByIdAndUpdate(
      queryId,
      { $set: managementRoleData },
      { new: true, runValidators: true }
    )
    .exec();

  return updatedManagementRole;
};

//Delete single managementRole
const deleteSingleManagementRoleService = async (
  managementRoleId: string | number
) => {
  const queryId =
    typeof managementRoleId === "string"
      ? new mongoose.Types.ObjectId(managementRoleId)
      : managementRoleId;

  const result = await managementRoleModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("ManagementRole not found");
  }

  return result;
};

//Delete many managementRole
const deleteManyManagementRoleService = async (
  managementRoleIds: (string | number)[]
) => {
  const queryIds = managementRoleIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await managementRoleModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const managementRoleServices = {
  createManagementRoleService,
  getAllManagementRoleService,
  getSingleManagementRoleService,
  updateSingleManagementRoleService,
  deleteSingleManagementRoleService,
  deleteManyManagementRoleService,
};
