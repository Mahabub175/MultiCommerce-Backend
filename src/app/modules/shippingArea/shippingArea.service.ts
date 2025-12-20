import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { shippingAreaModel } from "./shippingArea.model";
import { IShippingArea } from "./shippingArea.interface";

// Create a Shipping Area
const createShippingAreaService = async (areaData: IShippingArea) => {
  const areaName = (areaData.areaName || "").trim();

  // If an area with this name already exists:
  // - If caller is trying to set/update the DEFAULT ("Other Areas"), update it instead of creating
  // - Otherwise, keep the unique constraint behavior (surface duplicate error)
  const existingByName = areaName
    ? await shippingAreaModel.findOne({ areaName }).exec()
    : null;

  if (existingByName) {
    if (areaData.isDefault) {
      // Ensure no other default exists
      await shippingAreaModel.updateMany(
        { _id: { $ne: existingByName._id } },
        { $set: { isDefault: false } }
      );

      const updated = await shippingAreaModel
        .findByIdAndUpdate(
          existingByName._id,
          { $set: { ...areaData, areaName, isDefault: true } },
          { new: true, runValidators: true }
        )
        .exec();

      if (!updated) throw new Error("Failed to update default shipping area");
      return updated;
    }
  }

  // If this is set as default, ensure no other default exists
  if (areaData.isDefault) {
    await shippingAreaModel.updateMany({}, { $set: { isDefault: false } });
  }

  const result = await shippingAreaModel.create({ ...areaData, areaName });
  return result;
};

// Get all Shipping Areas with pagination
const getAllShippingAreasService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page || limit || searchText) {
    const query = shippingAreaModel.find();
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    return result;
  } else {
    results = await shippingAreaModel.find().sort({ createdAt: -1 }).exec();
    return {
      results,
    };
  }
};

// Get single Shipping Area
const getSingleShippingAreaService = async (areaId: string | number) => {
  const queryId =
    typeof areaId === "string"
      ? new mongoose.Types.ObjectId(areaId)
      : areaId;

  const result = await shippingAreaModel.findById(queryId).exec();
  if (!result) {
    throw new Error("Shipping area not found");
  }
  return result;
};

// Get default shipping area (for "other areas" price)
const getDefaultShippingAreaService = async () => {
  const result = await shippingAreaModel.findOne({ isDefault: true }).exec();
  return result;
};

// Find matching shipping area based on city, zipCode, or country
const findMatchingShippingAreaService = async (
  city?: string,
  zipCode?: string,
  country?: string
) => {
  // Try to match by city first
  if (city) {
    const cityMatch = await shippingAreaModel
      .findOne({
        status: true,
        cities: { $in: [new RegExp(city, "i")] },
      })
      .exec();
    if (cityMatch) return cityMatch;
  }

  // Try to match by zipCode
  if (zipCode) {
    const zipMatch = await shippingAreaModel
      .findOne({
        status: true,
        zipCodes: { $in: [zipCode] },
      })
      .exec();
    if (zipMatch) return zipMatch;
  }

  // Try to match by area name (fallback)
  if (country || city) {
    const areaMatch = await shippingAreaModel
      .findOne({
        status: true,
        areaName: new RegExp((country || city || "").toLowerCase(), "i"),
      })
      .exec();
    if (areaMatch) return areaMatch;
  }

  // Return default area if no match found
  return await getDefaultShippingAreaService();
};

// Update single Shipping Area
const updateSingleShippingAreaService = async (
  areaId: string | number,
  areaData: Partial<IShippingArea>
) => {
  const queryId =
    typeof areaId === "string"
      ? new mongoose.Types.ObjectId(areaId)
      : areaId;

  const area = await shippingAreaModel.findById(queryId).exec();

  if (!area) {
    throw new Error("Shipping area not found");
  }

  // If setting as default, ensure no other default exists
  if (areaData.isDefault) {
    await shippingAreaModel.updateMany(
      { _id: { $ne: queryId } },
      { $set: { isDefault: false } }
    );
  }

  const result = await shippingAreaModel
    .findByIdAndUpdate(
      queryId,
      { $set: areaData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Shipping area update failed");
  }

  return result;
};

// Delete single Shipping Area
const deleteSingleShippingAreaService = async (areaId: string | number) => {
  const queryId =
    typeof areaId === "string"
      ? new mongoose.Types.ObjectId(areaId)
      : areaId;

  const result = await shippingAreaModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Shipping area delete failed");
  }

  return result;
};

// Delete many Shipping Areas
const deleteManyShippingAreasService = async (areaIds: (string | number)[]) => {
  const queryIds = areaIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await shippingAreaModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const shippingAreaServices = {
  createShippingAreaService,
  getAllShippingAreasService,
  getSingleShippingAreaService,
  getDefaultShippingAreaService,
  findMatchingShippingAreaService,
  updateSingleShippingAreaService,
  deleteSingleShippingAreaService,
  deleteManyShippingAreasService,
};
