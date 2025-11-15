import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { userModel } from "./user.model";
import { IShippingAddress, IUser } from "./user.interface";
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

  if (!currentUser) {
    const query = userModel.find().select("-password role roleModel");
    const results = await query.sort({ createdAt: -1 }).exec();

    return {
      results: formatResultImage(results, "profileImage"),
    };
  }

  const query = userModel.find().select("-password").populate("role");
  const isSuperAdmin =
    currentUser.roleModel === "managementRole" &&
    currentUser.role === "super_admin";

  let baseFilter: any = {};

  if (!searchText && !isSuperAdmin) {
    const superAdminRole = await managementRoleModel.findOne({
      name: "super_admin",
    });
    if (superAdminRole) {
      baseFilter = {
        $or: [
          { roleModel: "customRole" },
          { roleModel: "managementRole", role: { $ne: superAdminRole._id } },
        ],
      };
    } else {
      baseFilter = {
        roleModel: { $in: ["customRole", "managementRole"] },
      };
    }
  }

  if (searchText) {
    const searchTerms = searchText.split(",").map((s) => s.trim());
    const orFilters: any[] = [];

    if (searchTerms.includes("status=true") || searchTerms.includes("active")) {
      baseFilter.$and = [...(baseFilter.$and || []), { status: true }];
    } else if (
      searchTerms.includes("status=false") ||
      searchTerms.includes("inactive")
    ) {
      baseFilter.$and = [...(baseFilter.$and || []), { status: false }];
    }

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
      const matchedRoleIds = matchedManagementRoles
        .filter((r) => r.name !== "super_admin")
        .map((r) => r._id);
      if (matchedRoleIds.length) {
        orFilters.push({
          roleModel: "managementRole",
          role: { $in: matchedRoleIds },
        });
      }
    }

    if (orFilters.length > 0) {
      baseFilter.$or = isSuperAdmin
        ? orFilters
        : orFilters.filter(
            (f) =>
              f.roleModel === "customRole" || f.roleModel === "managementRole"
          );
    }

    if (searchTerms.includes("admin") && !searchTerms.includes("super_admin")) {
      const superAdminRole = await managementRoleModel.findOne({
        name: "super_admin",
      });
      if (superAdminRole) {
        baseFilter.$and = [
          { role: { $ne: superAdminRole._id } },
          ...(baseFilter.$and || []),
        ];
      }
    }

    if (!isSuperAdmin) {
      const superAdminRole = await managementRoleModel.findOne({
        name: "super_admin",
      });
      if (superAdminRole) {
        baseFilter.$and = [
          ...(baseFilter.$and || []),
          { role: { $ne: superAdminRole._id } },
        ];
      }
    }
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
};

const addOrUpdateAddressService = async (
  userId: string,
  addressId: string,
  payload: any
) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");
  const isSettingDefault = payload.isDefault === true;

  if (isSettingDefault) {
    user.shippingAddresses.forEach((addr: any) => {
      addr.isDefault = false;
    });
  }

  if (addressId) {
    let found = false;

    user.shippingAddresses = user.shippingAddresses.map((addr: any) => {
      if (addr._id.toString() === addressId) {
        found = true;
        return { ...addr, ...payload };
      }
      return addr;
    });

    if (!found) throw new Error("Address not found");

    await user.save();

    return {
      message: "Address updated successfully",
      user,
    };
  }

  const newAddress = {
    firstName: payload.firstName || user.firstName,
    lastName: payload.lastName || user.lastName,
    phoneNumber: payload.phoneNumber || user.phoneNumber,
    country: payload.country,
    city: payload.city,
    zipCode: payload.zipCode,
    streetAddress: payload.streetAddress,
    addressSummery: payload.addressSummery,
    isDefault: isSettingDefault || user.shippingAddresses.length === 0,
  };

  user.shippingAddresses.push(newAddress);

  await user.save();
  return { message: "Shipping Address added successfully", user };
};

const deleteAddressService = async (userId: string, addressId: string) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");

  let isDefaultDeleted = false;
  let found = false;

  user.shippingAddresses = user.shippingAddresses.filter((addr: any) => {
    const match = addr._id.toString() === addressId;

    if (match) {
      found = true;
      if (addr.isDefault) isDefaultDeleted = true;
    }

    return !match;
  });

  if (!found) throw new Error("Address not found");

  if (isDefaultDeleted && user.shippingAddresses.length > 0) {
    user.shippingAddresses[0].isDefault = true;
  }

  await user.save();

  return {
    message: "Address deleted successfully",
    user,
  };
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
  addOrUpdateAddressService,
  deleteAddressService,
  deleteSingleUserService,
  deleteManyUsersService,
};
