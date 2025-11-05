import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { userModel } from "./user.model";
import { IUser } from "./user.interface";
import path from "path";
import fs from "fs";
import { managementRoleModel } from "../managementRole/managementRole.model";
import { customRoleModel } from "../customRole/customRole.model";

//Create a User into database
const createUserService = async (userData: IUser, filePath?: string) => {
  const dataToSave = { ...userData, filePath };
  const result = await userModel.create(dataToSave);
  return result;
};

const getAllUserService = async (
  currentUser: any,
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;
  const query = userModel.find().select("-password").populate("role");

  const isSuperAdmin =
    currentUser.roleModel === "managementRole" &&
    currentUser.role === "super_admin";

  let baseFilter: any = {};

  if (!searchText && !isSuperAdmin) {
    baseFilter.$or = [{ roleModel: "customRole" }];
  }

  if (searchText) {
    const searchTerms = searchText.split(",").map((s) => s.trim());
    const orFilters: any[] = [];

    if (searchTerms.includes("customRole")) {
      orFilters.push({ roleModel: "customRole" });
    } else {
      const matchedCustomRoles = await customRoleModel.find({
        name: { $in: searchTerms },
      });
      if (matchedCustomRoles.length) {
        orFilters.push({
          roleModel: "customRole",
          role: { $in: matchedCustomRoles.map((r) => r._id) },
        });
      }
    }

    if (searchTerms.includes("super_admin")) {
      const superAdminRole = await managementRoleModel.findOne({
        name: "super_admin",
      });
      if (superAdminRole) {
        orFilters.push({
          roleModel: "managementRole",
          role: superAdminRole._id,
        });
      }
    }

    const matchedManagementRoles = await managementRoleModel.find({
      name: { $in: searchTerms.filter((t) => t !== "super_admin") },
    });
    if (matchedManagementRoles.length) {
      orFilters.push({
        roleModel: "managementRole",
        role: { $in: matchedManagementRoles.map((r) => r._id) },
      });
    }

    baseFilter.$or = isSuperAdmin
      ? orFilters.length
        ? orFilters
        : undefined
      : orFilters.filter(
          (f) =>
            f.roleModel === "customRole" || f.roleModel === "managementRole"
        );
  }

  query.where(baseFilter);

  if (page || limit || searchText) {
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    result.results = formatResultImage<IUser>(
      result.results,
      "profileImage"
    ) as IUser[];
    return result;
  }

  results = await query.sort({ createdAt: -1 }).exec();
  results = formatResultImage(results, "profileImage");

  return { results };
};

// Get single User
const getSingleUserService = async (userId: number | string) => {
  const queryId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  const result = await userModel
    .findById(queryId)
    .select("-password")
    .populate("role")
    .exec();

  if (!result) {
    throw new Error("User not found");
  }

  if (typeof result.profileImage === "string") {
    const formattedAttachment = formatResultImage<IUser>(result.profileImage);
    if (typeof formattedAttachment === "string") {
      result.profileImage = formattedAttachment;
    }
  }

  return result;
};

//Update single User
const updateSingleUserService = async (
  userId: string | number,
  userData: IUser,
  currentUser: IUser
) => {
  const queryId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  const user = await userModel.findById(queryId).exec();
  if (!user) throw new Error("User not found");

  if (userData.role) {
    const isSuperAdmin =
      currentUser.roleModel === "managementRole" &&
      (currentUser.role as any) === "super_admin";

    const customRole = await customRoleModel.findById(userData.role);
    const managementRole = await managementRoleModel.findById(userData.role);

    if (!isSuperAdmin) {
      if (managementRole) {
        throw new Error(
          "You do not have permission to assign management roles."
        );
      }

      if (customRole) {
        userData.roleModel = "customRole";
      } else if (managementRole) {
        userData.roleModel = "managementRole";
      } else {
        throw new Error("Invalid role provided.");
      }
    }

    if (userData.profileImage && user.profileImage !== userData.profileImage) {
      const prevFileName = path.basename(user.profileImage || "");
      const prevFilePath = path.join(process.cwd(), "uploads", prevFileName);

      if (fs.existsSync(prevFilePath)) {
        try {
          fs.unlinkSync(prevFilePath);
        } catch (err) {
          console.warn(
            `Failed to delete previous attachment for user ${user._id}:`,
            err
          );
        }
      } else {
        console.warn(`Previous attachment not found for user ${user._id}`);
      }
    }

    const result = await userModel
      .findByIdAndUpdate(
        queryId,
        { $set: userData },
        { new: true, runValidators: true }
      )
      .exec();

    if (!result) throw new Error("User update failed");

    return result;
  }
};

//Delete single User
const deleteSingleUserService = async (userId: string | number) => {
  const queryId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  const user = await userModel.findById(queryId).exec();

  if (!user) {
    throw new Error("User not found");
  }

  if (user.profileImage) {
    const fileName = path.basename(user.profileImage);
    const attachmentPath = path.join(process.cwd(), "uploads", fileName);

    if (fs.existsSync(attachmentPath)) {
      try {
        fs.unlinkSync(attachmentPath);
      } catch (err) {
        throw new Error("Failed to delete attachment file");
      }
    } else {
      throw new Error("Attachment file not found on server");
    }
  }

  const result = await userModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("User delete failed");
  }

  return result;
};

//Delete many User
const deleteManyUsersService = async (userIds: (string | number)[]) => {
  const queryIds = userIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const users = await userModel.find({ _id: { $in: queryIds } });

  for (const user of users) {
    if (user.profileImage) {
      const fileName = path.basename(user.profileImage);
      const filePath = path.join(process.cwd(), "uploads", fileName);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn(`Failed to delete attachment for user ${user._id}`);
        }
      } else {
        console.warn(`Attachment not found for user ${user._id}`);
      }
    }
  }

  const result = await userModel.deleteMany({ _id: { $in: queryIds } }).exec();

  return result;
};

export const userServices = {
  createUserService,
  getAllUserService,
  getSingleUserService,
  updateSingleUserService,
  deleteSingleUserService,
  deleteManyUsersService,
};
