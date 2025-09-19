import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { newsletterModel } from "./newsletter.model";
import { INewsletter } from "./newsletter.interface";

//Create a newsletter into database
const createNewsletterService = async (
  newsletterData: INewsletter,
  filePath?: string
) => {
  const dataToSave = { ...newsletterData, filePath };
  const result = await newsletterModel.create(dataToSave);
  return result;
};

// Get all newsletter with optional pagination
const getAllNewsletterService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = newsletterModel.find();

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await newsletterModel.find().sort({ createdAt: -1 }).exec();

    return {
      results,
    };
  }
};

//Get single newsletter
const getSingleNewsletterService = async (newsletterId: number | string) => {
  const queryId =
    typeof newsletterId === "string"
      ? new mongoose.Types.ObjectId(newsletterId)
      : newsletterId;

  const result = await newsletterModel
    .findById(queryId)
    .populate("user")
    .exec();

  if (!result) {
    throw new Error("Newsletter not found");
  }

  return result;
};

//Update single newsletter
const updateSingleNewsletterService = async (
  newsletterId: string | number,
  newsletterData: INewsletter
) => {
  const queryId =
    typeof newsletterId === "string"
      ? new mongoose.Types.ObjectId(newsletterId)
      : newsletterId;

  const result = await newsletterModel
    .findByIdAndUpdate(
      queryId,
      { $set: newsletterData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Newsletter not found");
  }

  return result;
};

//Delete single newsletter
const deleteSingleNewsletterService = async (newsletterId: string | number) => {
  const queryId =
    typeof newsletterId === "string"
      ? new mongoose.Types.ObjectId(newsletterId)
      : newsletterId;

  const result = await newsletterModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Newsletter not found");
  }

  return result;
};

//Delete many newsletter
const deleteManyNewsletterService = async (
  newsletterIds: (string | number)[]
) => {
  const queryIds = newsletterIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await newsletterModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const newsletterServices = {
  createNewsletterService,
  getAllNewsletterService,
  getSingleNewsletterService,
  updateSingleNewsletterService,
  deleteSingleNewsletterService,
  deleteManyNewsletterService,
};
