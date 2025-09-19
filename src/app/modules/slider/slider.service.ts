import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { sliderModel } from "./slider.model";
import { ISlider } from "./slider.interface";
import path from "path";
import fs from "fs";

//Create a Slider into database
const createSliderService = async (sliderData: ISlider, filePath?: string) => {
  const dataToSave = { ...sliderData, filePath };
  const result = await sliderModel.create(dataToSave);
  return result;
};

// Get all Sliders withal pagination
const getAllSliderService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = sliderModel.find();
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    result.results = formatResultImage<ISlider>(
      result.results,
      "attachment"
    ) as ISlider[];

    return result;
  } else {
    results = await sliderModel.find().sort({ createdAt: -1 }).exec();

    results = formatResultImage(results, "attachment");

    return {
      results,
    };
  }
};

// Get single Slider
const getSingleSliderService = async (sliderId: number | string) => {
  const queryId =
    typeof sliderId === "string"
      ? new mongoose.Types.ObjectId(sliderId)
      : sliderId;

  const result = await sliderModel.findById(queryId).exec();
  if (!result) {
    throw new Error("Slider not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<ISlider>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

//Update single Slider
const updateSingleSliderService = async (
  sliderId: string | number,
  sliderData: ISlider
) => {
  const queryId =
    typeof sliderId === "string"
      ? new mongoose.Types.ObjectId(sliderId)
      : sliderId;

  const slider = await sliderModel.findById(queryId).exec();

  if (!slider) {
    throw new Error("Slider not found");
  }

  if (sliderData.attachment && slider.attachment !== sliderData.attachment) {
    const prevFileName = path.basename(slider.attachment);
    const prevFilePath = path.join(process.cwd(), "uploads", prevFileName);

    if (fs.existsSync(prevFilePath)) {
      try {
        fs.unlinkSync(prevFilePath);
      } catch (err) {
        console.warn(
          `Failed to delete previous attachment for slider ${slider._id}`
        );
      }
    } else {
      console.warn(`Previous attachment not found for slider ${slider._id}`);
    }
  }

  const result = await sliderModel
    .findByIdAndUpdate(
      queryId,
      { $set: sliderData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Slider update failed");
  }

  return result;
};

//Delete single Slider
const deleteSingleSliderService = async (sliderId: string | number) => {
  const queryId =
    typeof sliderId === "string"
      ? new mongoose.Types.ObjectId(sliderId)
      : sliderId;

  const slider = await sliderModel.findById(queryId).exec();

  if (!slider) {
    throw new Error("Slider not found");
  }

  if (slider.attachment) {
    const fileName = path.basename(slider.attachment);
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

  const result = await sliderModel.findByIdAndDelete(queryId).exec();

  return result;
};

//Delete many Slider
const deleteManySlidersService = async (sliderIds: (string | number)[]) => {
  const queryIds = sliderIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const sliders = await sliderModel.find({ _id: { $in: queryIds } });

  for (const slider of sliders) {
    if (slider.attachment) {
      const fileName = path.basename(slider.attachment);
      const filePath = path.join(process.cwd(), "uploads", fileName);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn(`Failed to delete attachment for slider ${slider._id}`);
        }
      } else {
        console.warn(`Attachment not found for slider ${slider._id}`);
      }
    }
  }

  const result = await sliderModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();
  return result;
};

export const sliderServices = {
  createSliderService,
  getAllSliderService,
  getSingleSliderService,
  updateSingleSliderService,
  deleteSingleSliderService,
  deleteManySlidersService,
};
