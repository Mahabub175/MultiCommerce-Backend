import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { ICategory } from "./category.interface";
import { CategoryLevel, categoryModel } from "./category.model";
import { formatResultImage } from "../../utils/formatResultImage";
import fs from "fs";
import path from "path";

const createCategoryService = async (
  categoryData: ICategory,
  filePath?: string
) => {
  const dataToSave = {
    ...categoryData,
    attachment: filePath,
  };

  const newCategory = await categoryModel.create(dataToSave);

  if (
    categoryData.level === CategoryLevel.CATEGORY &&
    categoryData.parentCategory
  ) {
    await categoryModel.findByIdAndUpdate(categoryData.parentCategory, {
      $addToSet: { categories: newCategory._id },
    });
  }

  if (
    categoryData.level === CategoryLevel.SUB_CATEGORY &&
    categoryData.category
  ) {
    await categoryModel.findByIdAndUpdate(categoryData.category, {
      $addToSet: { subcategories: newCategory._id },
    });
  }

  if (
    categoryData.level === CategoryLevel.SUB_SUB_CATEGORY &&
    categoryData.subCategory
  ) {
    await categoryModel.findByIdAndUpdate(categoryData.subCategory, {
      $addToSet: { subSubCategories: newCategory._id },
    });
  }

  return newCategory;
};

// Get all categories
const getAllCategoryService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  const query = categoryModel
    .find()
    .populate("parentCategory", "name")
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("subSubCategory", "name");

  if (page && limit) {
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    result.results = formatResultImage<ICategory>(
      result.results,
      "attachment"
    ) as ICategory[];
    return result;
  } else {
    results = await query.sort({ createdAt: -1 }).exec();
    results = formatResultImage(results, "attachment");
    return { results };
  }
};

// Get single category
const getSingleCategoryService = async (categoryId: string | number) => {
  const queryId =
    typeof categoryId === "string"
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;

  const result = await categoryModel
    .findById(queryId)
    .populate("parentCategory", "name")
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("subSubCategory", "name")
    .exec();

  if (!result) {
    throw new Error("Category not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<ICategory>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

// Update single category
const updateSingleCategoryService = async (
  categoryId: string | number,
  categoryData: ICategory
) => {
  const queryId =
    typeof categoryId === "string"
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;

  const existingCategory = await categoryModel.findById(queryId);
  if (!existingCategory) {
    throw new Error("Category not found");
  }

  // If attachment is being updated, delete old file
  if (
    categoryData.attachment &&
    existingCategory.attachment !== categoryData.attachment
  ) {
    const prevFileName = path.basename(existingCategory.attachment);
    const prevFilePath = path.join(process.cwd(), "uploads", prevFileName);
    if (fs.existsSync(prevFilePath)) {
      fs.unlinkSync(prevFilePath);
    }
  }

  const updatedCategory = await categoryModel
    .findByIdAndUpdate(
      queryId,
      { $set: categoryData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!updatedCategory) {
    throw new Error("Category update failed");
  }

  // If the level or parent has changed, update hierarchy relations
  if (
    updatedCategory.level !== existingCategory.level ||
    updatedCategory.parentCategory?.toString() !==
      existingCategory.parentCategory?.toString() ||
    updatedCategory.category?.toString() !==
      existingCategory.category?.toString() ||
    updatedCategory.subCategory?.toString() !==
      existingCategory.subCategory?.toString()
  ) {
    // Remove from old relationships
    if (
      existingCategory.level === CategoryLevel.CATEGORY &&
      existingCategory.parentCategory
    ) {
      await categoryModel.findByIdAndUpdate(existingCategory.parentCategory, {
        $pull: { categories: updatedCategory._id },
      });
    }

    if (
      existingCategory.level === CategoryLevel.SUB_CATEGORY &&
      existingCategory.category
    ) {
      await categoryModel.findByIdAndUpdate(existingCategory.category, {
        $pull: { subcategories: updatedCategory._id },
      });
    }

    if (
      existingCategory.level === CategoryLevel.SUB_SUB_CATEGORY &&
      existingCategory.subCategory
    ) {
      await categoryModel.findByIdAndUpdate(existingCategory.subCategory, {
        $pull: { subSubCategories: updatedCategory._id },
      });
    }

    // Add to new relationships
    if (
      updatedCategory.level === CategoryLevel.CATEGORY &&
      updatedCategory.parentCategory
    ) {
      await categoryModel.findByIdAndUpdate(updatedCategory.parentCategory, {
        $addToSet: { categories: updatedCategory._id },
      });
    }

    if (
      updatedCategory.level === CategoryLevel.SUB_CATEGORY &&
      updatedCategory.category
    ) {
      await categoryModel.findByIdAndUpdate(updatedCategory.category, {
        $addToSet: { subcategories: updatedCategory._id },
      });
    }

    if (
      updatedCategory.level === CategoryLevel.SUB_SUB_CATEGORY &&
      updatedCategory.subCategory
    ) {
      await categoryModel.findByIdAndUpdate(updatedCategory.subCategory, {
        $addToSet: { subSubCategories: updatedCategory._id },
      });
    }
  }

  return updatedCategory;
};

// Delete single category
const deleteSingleCategoryService = async (categoryId: string | number) => {
  const queryId =
    typeof categoryId === "string"
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;

  const category = await categoryModel.findById(queryId);
  if (!category) {
    throw new Error("Category not found");
  }

  // Delete attachment if exists
  if (category.attachment) {
    const fileName = path.basename(category.attachment);
    const attachmentPath = path.join(process.cwd(), "uploads", fileName);
    if (fs.existsSync(attachmentPath)) {
      fs.unlinkSync(attachmentPath);
    }
  }

  // Remove references from parent categories
  if (category.level === CategoryLevel.CATEGORY && category.parentCategory) {
    await categoryModel.findByIdAndUpdate(category.parentCategory, {
      $pull: { categories: category._id },
    });
  }

  if (category.level === CategoryLevel.SUB_CATEGORY && category.category) {
    await categoryModel.findByIdAndUpdate(category.category, {
      $pull: { subcategories: category._id },
    });
  }

  if (
    category.level === CategoryLevel.SUB_SUB_CATEGORY &&
    category.subCategory
  ) {
    await categoryModel.findByIdAndUpdate(category.subCategory, {
      $pull: { subSubCategories: category._id },
    });
  }

  return await categoryModel.findByIdAndDelete(queryId).exec();
};

// Delete many categories
const deleteManyCategoriesService = async (
  categoryIds: (string | number)[]
) => {
  const queryIds = categoryIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const categories = await categoryModel.find({ _id: { $in: queryIds } });

  // Delete all attachments
  for (const category of categories) {
    if (category.attachment) {
      const fileName = path.basename(category.attachment);
      const filePath = path.join(process.cwd(), "uploads", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  return await categoryModel.deleteMany({ _id: { $in: queryIds } }).exec();
};

export const categoryServices = {
  createCategoryService,
  getAllCategoryService,
  getSingleCategoryService,
  updateSingleCategoryService,
  deleteSingleCategoryService,
  deleteManyCategoriesService,
};
