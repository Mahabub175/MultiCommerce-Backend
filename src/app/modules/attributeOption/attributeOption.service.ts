import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { IAttributeOption } from "./attributeOption.interface";
import { attributeOptionModel } from "./attributeOption.model";

// Create Attribute Option
const createAttributeOptionService = async (
  attributeOptionData: IAttributeOption,
  filePath?: string
) => {
  const dataToSave = { ...attributeOptionData, attachment: filePath };
  const result = await attributeOptionModel.create(dataToSave);
  return result;
};

// Get all Attribute Options with pagination
const getAllAttributeOptionService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page || limit || searchText) {
    const query = attributeOptionModel.find();
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    result.results = formatResultImage<IAttributeOption>(
      result.results,
      "attachment"
    ) as IAttributeOption[];

    return result;
  } else {
    results = await attributeOptionModel.find().sort({ createdAt: -1 }).exec();

    results = formatResultImage(results, "attachment");

    return {
      results,
    };
  }
};

// Get single Attribute Option
const getSingleAttributeOptionService = async (
  attributeOptionId: number | string
) => {
  const queryId =
    typeof attributeOptionId === "string"
      ? new mongoose.Types.ObjectId(attributeOptionId)
      : attributeOptionId;

  const result = await attributeOptionModel.findById(queryId).exec();

  if (!result) {
    throw new Error("Attribute Option not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<IAttributeOption>(
      result.attachment
    );
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

// Update single Attribute Option
const updateSingleAttributeOptionService = async (
  attributeOptionId: string | number,
  attributeOptionData: IAttributeOption
) => {
  const queryId =
    typeof attributeOptionId === "string"
      ? new mongoose.Types.ObjectId(attributeOptionId)
      : attributeOptionId;

  const attributeOption = await attributeOptionModel.findById(queryId).exec();

  if (!attributeOption) {
    throw new Error("Attribute Option not found");
  }

  // If attachment is changed, delete the old one
  if (
    attributeOptionData.attachment &&
    attributeOption.attachment !== attributeOptionData.attachment
  ) {
    const prevFileName = path.basename(attributeOption.attachment);
    const prevFilePath = path.join(process.cwd(), "uploads", prevFileName);

    if (fs.existsSync(prevFilePath)) {
      try {
        fs.unlinkSync(prevFilePath);
      } catch (err) {
        console.warn(
          `Failed to delete previous attachment for attribute option ${attributeOption._id}`
        );
      }
    } else {
      console.warn(
        `Previous attachment not found for attribute option ${attributeOption._id}`
      );
    }
  }

  const result = await attributeOptionModel
    .findByIdAndUpdate(
      queryId,
      { $set: attributeOptionData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Failed to update Attribute Option");
  }

  return result;
};

// Delete single Attribute Option
const deleteSingleAttributeOptionService = async (
  attributeOptionId: string | number
) => {
  const queryId =
    typeof attributeOptionId === "string"
      ? new mongoose.Types.ObjectId(attributeOptionId)
      : attributeOptionId;

  const attributeOption = await attributeOptionModel.findById(queryId).exec();

  if (!attributeOption) {
    throw new Error("Attribute Option not found");
  }

  // Delete file if exists
  if (attributeOption.attachment) {
    const fileName = path.basename(attributeOption.attachment);
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

  const result = await attributeOptionModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Attribute Option delete failed");
  }

  return result;
};

// Delete many Attribute Options
const deleteManyAttributeOptionsService = async (
  attributeOptionIds: (string | number)[]
) => {
  const queryIds = attributeOptionIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const attributeOptions = await attributeOptionModel.find({
    _id: { $in: queryIds },
  });

  for (const attributeOption of attributeOptions) {
    if (attributeOption.attachment) {
      const fileName = path.basename(attributeOption.attachment);
      const filePath = path.join(process.cwd(), "uploads", fileName);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn(
            `Failed to delete attachment for attribute option ${attributeOption._id}`
          );
        }
      } else {
        console.warn(
          `Attachment not found for attribute option ${attributeOption._id}`
        );
      }
    }
  }

  const result = await attributeOptionModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const attributeOptionServices = {
  createAttributeOptionService,
  getAllAttributeOptionService,
  getSingleAttributeOptionService,
  updateSingleAttributeOptionService,
  deleteSingleAttributeOptionService,
  deleteManyAttributeOptionsService,
};
