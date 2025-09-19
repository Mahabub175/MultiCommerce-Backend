import mongoose from "mongoose";
import { formatResultImage } from "../../utils/formatResultImage";
import { IGlobalSetting } from "./globalSetting.interface";
import { globalSettingModel } from "./globalSetting.model";
import path from "path";
import fs from "fs";

//Create a globalSetting into database
const createGlobalSettingService = async (
  globalSettingData: IGlobalSetting,
  filePath?: string
) => {
  const dataToSave = { ...globalSettingData, filePath };
  const result = await globalSettingModel.create(dataToSave);
  return result;
};

// Get all globalSetting with optional pagination
const getAllGlobalSettingService = async () => {
  let results;

  results = await globalSettingModel.find().exec();

  results = formatResultImage(results, "logo");
  results = formatResultImage(results, "favicon");
  results = formatResultImage(results, "aboutBanner");
  results = formatResultImage(results, "serviceBanner");
  results = formatResultImage(results, "workBanner");
  results = formatResultImage(results, "galleryBanner");
  results = formatResultImage(results, "shopBanner");
  results = formatResultImage(results, "contactBanner");
  results = formatResultImage(results, "processBanner");
  results = formatResultImage(results, "blogBanner");

  return {
    result: results[0] || null,
  };
};

//Update single globalSetting
const updateSingleGlobalSettingService = async (
  globalSettingId: string | number,
  globalSettingData: IGlobalSetting
) => {
  const queryId =
    typeof globalSettingId === "string"
      ? new mongoose.Types.ObjectId(globalSettingId)
      : globalSettingId;

  const currentGlobalSetting = await globalSettingModel
    .findById(queryId)
    .exec();

  if (!currentGlobalSetting) {
    throw new Error("Global Setting not found");
  }

  const globalSetting = currentGlobalSetting as IGlobalSetting;

  const imageFields: (keyof IGlobalSetting)[] = [
    "logo",
    "favicon",
    "aboutBanner",
    "serviceBanner",
    "workBanner",
    "galleryBanner",
    "shopBanner",
    "contactBanner",
    "blogBanner",
    "processBanner",
  ];

  imageFields.forEach((field) => {
    const prevImage = globalSetting[field];
    const newImage = globalSettingData[field];

    if (
      typeof prevImage === "string" &&
      typeof newImage === "string" &&
      newImage !== prevImage
    ) {
      const prevFileName = path.basename(prevImage);
      const prevFilePath = path.join(process.cwd(), "uploads", prevFileName);

      if (fs.existsSync(prevFilePath)) {
        try {
          fs.unlinkSync(prevFilePath);
        } catch (err) {
          console.warn(`Failed to delete previous image for ${field}`);
        }
      } else {
        console.warn(`Previous image not found for ${field}`);
      }
    }
  });

  const result = await globalSettingModel
    .findByIdAndUpdate(
      queryId,
      { $set: globalSettingData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Failed to update global setting");
  }

  return result;
};

export const globalSettingServices = {
  createGlobalSettingService,
  getAllGlobalSettingService,
  updateSingleGlobalSettingService,
};
