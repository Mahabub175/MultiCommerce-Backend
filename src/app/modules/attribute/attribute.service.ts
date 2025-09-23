import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { IAttribute } from "./attribute.interface";
import { attributeModel } from "./attribute.model";
import { attributeOptionModel } from "../attributeOption/attributeOption.model";

//Create a Attribute into database
const createAttributeService = async (attributeData: IAttribute) => {
  const attributeResult = await attributeModel.create(attributeData);

  if (
    Array.isArray(attributeData.options) &&
    attributeData.options.length > 0
  ) {
    await Promise.all(
      attributeData.options.map(async (optionId) => {
        await attributeOptionModel.findByIdAndUpdate(
          optionId,
          { attribute: attributeResult._id },
          { new: true, upsert: false }
        );
      })
    );
  }

  return attributeResult;
};

// Get all Attributes with optional pagination
const getAllAttributeService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = attributeModel.find().populate("options");
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await attributeModel
      .find()
      .populate("options")
      .sort({ createdAt: -1 })
      .exec();

    return {
      results,
    };
  }
};

//Get single Attribute
const getSingleAttributeService = async (AttributeId: number | string) => {
  const queryId =
    typeof AttributeId === "string"
      ? new mongoose.Types.ObjectId(AttributeId)
      : AttributeId;

  // Find the Attribute by ID
  const result = await attributeModel
    .findById(queryId)
    .populate("options")
    .exec();
  if (!result) {
    throw new Error("Attribute not found");
  }

  return result;
};

//Update single Attribute
const updateSingleAttributeService = async (
  attributeId: string | number,
  attributeData: IAttribute
) => {
  const queryId =
    typeof attributeId === "string"
      ? new mongoose.Types.ObjectId(attributeId)
      : attributeId;

  const result = await attributeModel
    .findByIdAndUpdate(
      queryId,
      { $set: attributeData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Attribute not found");
  }

  if (
    Array.isArray(attributeData.options) &&
    attributeData.options.length > 0
  ) {
    await Promise.all(
      attributeData.options.map(async (optionId) => {
        await attributeOptionModel.findByIdAndUpdate(
          optionId,
          { attribute: result._id },
          { new: true, upsert: false }
        );
      })
    );
  }

  return result;
};

//Delete single Attribute
const deleteSingleAttributeService = async (attributeId: string | number) => {
  const queryId =
    typeof attributeId === "string"
      ? new mongoose.Types.ObjectId(attributeId)
      : attributeId;

  const result = await attributeModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Attribute not found");
  }

  return result;
};

//Delete many Attribute
const deleteManyAttributesService = async (
  attributeIds: (string | number)[]
) => {
  const queryIds = attributeIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await attributeModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const attributeServices = {
  createAttributeService,
  getAllAttributeService,
  getSingleAttributeService,
  updateSingleAttributeService,
  deleteSingleAttributeService,
  deleteManyAttributesService,
};
