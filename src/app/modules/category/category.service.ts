import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { ICategory } from "./category.interface";
import { CategoryLevel, categoryModel } from "./category.model";
import { formatResultImage } from "../../utils/formatResultImage";
import fs from "fs";
import path from "path";
import { updateMegaMenuStatus } from "../../utils/updateMegaMenuStatus";
import { applyCategoryDiscountToProducts } from "../../utils/applyDiscountToCategoryProducts";

// Create a category
export const createCategoryService = async (
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
      $addToSet: {
        categories: newCategory._id,
        children: newCategory._id,
      },
    });
  }

  if (
    categoryData.level === CategoryLevel.SUB_CATEGORY &&
    categoryData.categories
  ) {
    const parentCategories = Array.isArray(categoryData.categories)
      ? categoryData.categories
      : [categoryData.categories];

    await Promise.all(
      parentCategories.map((id) =>
        categoryModel.findByIdAndUpdate(id, {
          $addToSet: {
            subcategories: newCategory._id,
            children: newCategory._id,
          },
        })
      )
    );
  }

  if (
    categoryData.level === CategoryLevel.SUB_SUB_CATEGORY &&
    categoryData.subCategories
  ) {
    const parentSubCategories = Array.isArray(categoryData.subCategories)
      ? categoryData.subCategories
      : [categoryData.subCategories];

    await Promise.all(
      parentSubCategories.map((id) =>
        categoryModel.findByIdAndUpdate(id, {
          $addToSet: {
            subSubCategories: newCategory._id,
            children: newCategory._id,
          },
        })
      )
    );
  }

  if (categoryData.discountType && categoryData.discountValue) {
    await applyCategoryDiscountToProducts(
      newCategory._id.toString(),
      categoryData.discountType,
      categoryData.discountValue
    );
  }

  if (newCategory.megaMenuStatus) {
    await updateMegaMenuStatus(newCategory._id.toString(), true);
  }

  return newCategory;
};

// Get all categories
const getAllCategoryService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[],
  sortOrder: "asc" | "desc" = "asc"
) => {
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const query = categoryModel
    .find()
    .populate("parentCategory", "name")
    .populate("categories", "name")
    .populate("subCategories", "name")
    .populate("subSubCategories", "name")
    .sort({ sortingOrder: sortDirection });

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
    const results = await query.exec();
    return { results: formatResultImage(results, "attachment") };
  }
};

// Get single category
const getSingleCategoryService = async (categoryId: string | number) => {
  const queryId =
    typeof categoryId === "string"
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;
  const category = await categoryModel
    .findById(queryId)
    .populate("parentCategory", "name")
    .populate("categories", "name")
    .populate("subCategories", "name")
    .populate("subSubCategories", "name")
    .exec();

  if (!category) throw new Error("Category not found");

  if (category.attachment)
    category.attachment = formatResultImage<ICategory>(
      category.attachment
    ) as string;

  return category;
};

// Update single category
export const updateSingleCategoryService = async (
  categoryId: string | number,
  categoryData: ICategory
) => {
  const queryId =
    typeof categoryId === "string"
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;

  const existingCategory = await categoryModel.findById(queryId);
  if (!existingCategory) throw new Error("Category not found");

  if (
    categoryData.attachment &&
    existingCategory.attachment !== categoryData.attachment
  ) {
    const prevFile = path.join(
      process.cwd(),
      "uploads",
      path.basename(existingCategory.attachment || "")
    );
    if (fs.existsSync(prevFile)) {
      fs.unlinkSync(prevFile);
    }
  }

  const updatedCategory = await categoryModel
    .findByIdAndUpdate(
      queryId,
      { $set: { ...categoryData } },
      { new: true, runValidators: true }
    )
    .exec();

  if (!updatedCategory) throw new Error("Category update failed");

  const updateHierarchy = async (
    levelField: keyof ICategory,
    oldParents: any,
    newParents: any
  ) => {
    const oldParentArray = oldParents
      ? Array.isArray(oldParents)
        ? oldParents.map((id) => id.toString())
        : [oldParents.toString()]
      : [];

    const newParentArray = newParents
      ? Array.isArray(newParents)
        ? newParents.map((id) => id.toString())
        : [newParents.toString()]
      : [];

    const parentsToRemove = oldParentArray.filter(
      (id) => !newParentArray.includes(id)
    );
    const parentsToAdd = newParentArray.filter(
      (id) => !oldParentArray.includes(id)
    );

    await Promise.all([
      ...parentsToRemove.map((id) =>
        categoryModel.findByIdAndUpdate(id, {
          $pull: {
            [levelField]: updatedCategory._id,
            children: updatedCategory._id,
          },
        })
      ),
      ...parentsToAdd.map((id) =>
        categoryModel.findByIdAndUpdate(id, {
          $addToSet: {
            [levelField]: updatedCategory._id,
            children: updatedCategory._id,
          },
        })
      ),
    ]);
  };

  const level = updatedCategory.level;

  if (level === CategoryLevel.CATEGORY) {
    await updateHierarchy(
      "categories",
      existingCategory.parentCategory,
      updatedCategory.parentCategory
    );
  } else if (level === CategoryLevel.SUB_CATEGORY) {
    await updateHierarchy(
      "subCategories",
      existingCategory.categories,
      updatedCategory.categories
    );
  } else if (level === CategoryLevel.SUB_SUB_CATEGORY) {
    await updateHierarchy(
      "subSubCategories",
      existingCategory.subCategories,
      updatedCategory.subCategories
    );
  }

  if (categoryData.discountType && categoryData.discountValue) {
    await applyCategoryDiscountToProducts(
      updatedCategory._id.toString(),
      updatedCategory.discountType,
      updatedCategory.discountValue
    );
  }

  if (
    typeof categoryData.megaMenuStatus !== "undefined" &&
    categoryData.megaMenuStatus !== existingCategory.megaMenuStatus
  ) {
    await updateMegaMenuStatus(
      updatedCategory._id.toString(),
      categoryData.megaMenuStatus as boolean
    );
  }

  return updatedCategory;
};

// Delete single category
export const deleteSingleCategoryService = async (
  categoryId: string | number
) => {
  const queryId =
    typeof categoryId === "string"
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;

  const category = await categoryModel.findById(queryId);
  if (!category) throw new Error("Category not found");

  if (category.attachment) {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      path.basename(category.attachment)
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const removeFromParents = async (
    levelField: keyof ICategory,
    parentIds: any
  ) => {
    if (!parentIds) return;
    const parentArray = Array.isArray(parentIds) ? parentIds : [parentIds];
    await Promise.all(
      parentArray.map((id) =>
        categoryModel.findByIdAndUpdate(id, {
          $pull: { [levelField]: category._id, children: category._id },
        })
      )
    );
  };

  if (category.level === CategoryLevel.CATEGORY) {
    await removeFromParents("categories", category.parentCategory);
  }
  if (category.level === CategoryLevel.SUB_CATEGORY) {
    await removeFromParents("subCategories", category.categories);
  }
  if (category.level === CategoryLevel.SUB_SUB_CATEGORY) {
    await removeFromParents("subSubCategories", category.subCategories);
  }

  return await categoryModel.findByIdAndDelete(queryId).exec();
};

// Delete Many Categories
export const deleteManyCategoriesService = async (
  categoryIds: (string | number)[]
) => {
  const queryIds = categoryIds.map((id) =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : id
  );

  const categories = await categoryModel.find({ _id: { $in: queryIds } });
  if (!categories || categories.length === 0) {
    throw new Error("No categories found to delete");
  }

  const removeFromParents = async (
    levelField: keyof ICategory,
    parentIds: any,
    childId: mongoose.Types.ObjectId
  ) => {
    if (!parentIds) return;
    const parentArray = Array.isArray(parentIds) ? parentIds : [parentIds];
    await Promise.all(
      parentArray.map((id) =>
        categoryModel.findByIdAndUpdate(id, {
          $pull: { [levelField]: childId, children: childId },
        })
      )
    );
  };

  for (const category of categories) {
    if (category.attachment) {
      const filePath = path.join(
        process.cwd(),
        "uploads",
        path.basename(category.attachment)
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    if (category.level === CategoryLevel.CATEGORY) {
      await removeFromParents(
        "categories",
        category.parentCategory,
        category._id
      );
    }
    if (category.level === CategoryLevel.SUB_CATEGORY) {
      await removeFromParents(
        "subCategories",
        category.categories,
        category._id
      );
    }
    if (category.level === CategoryLevel.SUB_SUB_CATEGORY) {
      await removeFromParents(
        "subSubCategories",
        category.subCategories,
        category._id
      );
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
