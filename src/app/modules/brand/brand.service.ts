import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { brandModel } from "./brand.model";
import { IBrand } from "./brand.interface";
import path from "path";
import fs from "fs";

//Create a Brand into database
const createBrandService = async (brandData: IBrand, filePath?: string) => {
  const dataToSave = { ...brandData, filePath };
  const result = await brandModel.create(dataToSave);
  return result;
};

// Get all Brands withal pagination
const getAllBrandService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = brandModel.find();
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    result.results = formatResultImage<IBrand>(
      result.results,
      "attachment"
    ) as IBrand[];

    return result;
  } else {
    results = await brandModel.find().sort({ createdAt: -1 }).exec();

    results = formatResultImage(results, "attachment");

    return {
      results,
    };
  }
};

// Get single Brand
const getSingleBrandService = async (brandId: number | string) => {
  const queryId =
    typeof brandId === "string"
      ? new mongoose.Types.ObjectId(brandId)
      : brandId;

  const result = await brandModel.findById(queryId).exec();
  if (!result) {
    throw new Error("Brand not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<IBrand>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

//Update single Brand
const updateSingleBrandService = async (
  brandId: string | number,
  brandData: IBrand
) => {
  const queryId =
    typeof brandId === "string"
      ? new mongoose.Types.ObjectId(brandId)
      : brandId;

  const brand = await brandModel.findById(queryId).exec();

  if (!brand) {
    throw new Error("Brand not found");
  }

  if (brandData.attachment && brand.attachment !== brandData.attachment) {
    const prevFileName = path.basename(brand.attachment);
    const prevFilePath = path.join(process.cwd(), "uploads", prevFileName);

    if (fs.existsSync(prevFilePath)) {
      try {
        fs.unlinkSync(prevFilePath);
      } catch (err) {
        console.warn(
          `Failed to delete previous attachment for brand ${brand._id}`
        );
      }
    } else {
      console.warn(`Previous attachment not found for brand ${brand._id}`);
    }
  }

  const result = await brandModel
    .findByIdAndUpdate(
      queryId,
      { $set: brandData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Brand update failed");
  }

  return result;
};

//Delete single Brand
const deleteSingleBrandService = async (brandId: string | number) => {
  const queryId =
    typeof brandId === "string"
      ? new mongoose.Types.ObjectId(brandId)
      : brandId;

  const brand = await brandModel.findById(queryId).exec();

  if (!brand) {
    throw new Error("Brand not found");
  }

  if (brand.attachment) {
    const fileName = path.basename(brand.attachment);
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

  const result = await brandModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Brand delete failed");
  }

  return result;
};

//Delete many Brand
const deleteManyBrandsService = async (brandIds: (string | number)[]) => {
  const queryIds = brandIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const brands = await brandModel.find({ _id: { $in: queryIds } });

  for (const brand of brands) {
    if (brand.attachment) {
      const fileName = path.basename(brand.attachment);
      const filePath = path.join(process.cwd(), "uploads", fileName);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn(`Failed to delete attachment for brand ${brand._id}`);
        }
      } else {
        console.warn(`Attachment not found for brand ${brand._id}`);
      }
    }
  }

  const result = await brandModel.deleteMany({ _id: { $in: queryIds } }).exec();

  return result;
};

export const brandServices = {
  createBrandService,
  getAllBrandService,
  getSingleBrandService,
  updateSingleBrandService,
  deleteSingleBrandService,
  deleteManyBrandsService,
};
