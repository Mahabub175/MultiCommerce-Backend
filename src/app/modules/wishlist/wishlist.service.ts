import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { IWishlist } from "./wishlist.interface";
import { wishlistModel } from "./wishlist.model";

//Create a wishlist into database
const createWishlistService = async (wishlistData: IWishlist) => {
  const { user, deviceId, product } = wishlistData;

  // Ensure either user or deviceId is provided, but not both
  if (!user && !deviceId) {
    throw new Error("Either user or deviceId must be provided.");
  }

  const query: any = { product };

  if (user) query.user = user;
  if (deviceId) query.deviceId = deviceId;

  const existingCompare = await wishlistModel.findOne(query);

  if (existingCompare) {
    throw new Error("This product is already in your wishlist.");
  }

  const dataToSave = { ...wishlistData };
  const result = await wishlistModel.create(dataToSave);

  return result;
};

// Get all wishlist with optional pagination
const getAllWishlistService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page || limit || searchText) {
    const query = wishlistModel.find().populate("product").populate("user");

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await wishlistModel
      .find()
      .populate("product")
      .populate("user")
      .sort({ createdAt: -1 })
      .exec();

    return {
      results,
    };
  }
};

//Get single wishlist
const getSingleWishlistService = async (wishlistId: number | string) => {
  const queryId =
    typeof wishlistId === "string"
      ? new mongoose.Types.ObjectId(wishlistId)
      : wishlistId;

  const result = await wishlistModel
    .findById(queryId)
    .populate("product")
    .populate("user")
    .exec();

  if (!result) {
    throw new Error("wishlist not found");
  }

  return result;
};

const getSingleWishlistByUserService = async (userId: string) => {
  let query;

  if (mongoose.Types.ObjectId.isValid(userId)) {
    query = {
      $or: [{ user: userId }, { deviceId: userId }],
    };
  } else {
    query = {
      $or: [{ deviceId: userId }],
    };
  }

  const result = await wishlistModel
    .find(query)
    .populate("product")
    .populate("user")
    .exec();

  return result;
};

//Update single wishlist
const updateSingleWishlistService = async (
  wishlistId: string | number,
  wishlistData: IWishlist
) => {
  const queryId =
    typeof wishlistId === "string"
      ? new mongoose.Types.ObjectId(wishlistId)
      : wishlistId;

  const result = await wishlistModel
    .findByIdAndUpdate(
      queryId,
      { $set: wishlistData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("wishlist not found");
  }

  return result;
};

//Delete single wishlist
const deleteSingleWishlistService = async (wishlistId: string | number) => {
  const queryId =
    typeof wishlistId === "string"
      ? new mongoose.Types.ObjectId(wishlistId)
      : wishlistId;

  const result = await wishlistModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("wishlist not found");
  }

  return result;
};

//Delete many wishlist
const deleteManyWishlistService = async (wishlistIds: (string | number)[]) => {
  const queryIds = wishlistIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await wishlistModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const wishlistServices = {
  createWishlistService,
  getAllWishlistService,
  getSingleWishlistService,
  getSingleWishlistByUserService,
  updateSingleWishlistService,
  deleteSingleWishlistService,
  deleteManyWishlistService,
};
