import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { ICategory } from "./category.interface";
import { CategoryLevel, categoryModel } from "./category.model";
import { formatResultImage } from "../../utils/formatResultImage";
import fs from "fs";
import path from "path";
import {
  applyCategoryDiscountToProducts,
  applyRoleDiscountsToProducts,
} from "../../utils/applyDiscountToCategoryProducts";
import { customRoleModel } from "../customRole/customRole.model";
import { deleteFileSync } from "../../utils/deleteFilesFromStorage";

// Create a category
const createCategoryService = async (categoryData: ICategory) => {
  const dataToSave = {
    ...categoryData,
  };
  const allCustomRoles = await customRoleModel.find({ status: true });

  const roleDiscounts = allCustomRoles.map((role) => ({
    role: role._id,
    discountType: role.discountType,
    discountValue: role.discountValue,
    minimumQuantity: role.minimumQuantity,
    status: true,
  }));

  dataToSave.roleDiscounts = roleDiscounts;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let newCategoryOrder = dataToSave.sortingOrder ?? 0;

    if (newCategoryOrder > 0) {
      await categoryModel.updateMany(
        { sortingOrder: { $gte: newCategoryOrder } },
        { $inc: { sortingOrder: 1 } },
        { session }
      );
    } else {
      const lastCategory = await categoryModel
        .findOne()
        .sort({ sortingOrder: -1 })
        .session(session);
      newCategoryOrder = lastCategory ? lastCategory.sortingOrder + 1 : 1;
    }

    dataToSave.sortingOrder = newCategoryOrder;

    const newCategory = await categoryModel.create([dataToSave], { session });
    const createdCategory = newCategory[0];

    if (
      categoryData.level === CategoryLevel.CATEGORY &&
      categoryData.parentCategory
    ) {
      await categoryModel.findByIdAndUpdate(
        categoryData.parentCategory,
        {
          $addToSet: {
            categories: createdCategory._id,
            children: createdCategory._id,
          },
        },
        { session }
      );
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
          categoryModel.findByIdAndUpdate(
            id,
            {
              $addToSet: {
                subCategories: createdCategory._id,
                children: createdCategory._id,
              },
            },
            { session }
          )
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
          categoryModel.findByIdAndUpdate(
            id,
            {
              $addToSet: {
                subSubCategories: createdCategory._id,
                children: createdCategory._id,
              },
            },
            { session }
          )
        )
      );
    }

    if (categoryData.discountType && categoryData.discountValue) {
      await applyCategoryDiscountToProducts(
        createdCategory._id.toString(),
        categoryData.discountType,
        categoryData.discountValue
      );
    }

    await applyRoleDiscountsToProducts(createdCategory._id.toString());

    await session.commitTransaction();
    session.endSession();

    return createdCategory;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
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
    .populate("roleDiscounts.role")
    .sort({ sortingOrder: sortDirection });

  if (page || limit || searchText) {
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
    .populate("roleDiscounts.role")
    .exec();

  if (!category) throw new Error("Category not found");

  if (category.attachment)
    category.attachment = formatResultImage<ICategory>(
      category.attachment
    ) as string;

  return category;
};

const getNestedCategoriesService = async () => {
  const allCategories = await categoryModel
    .find()
    .select(
      "_id name slug level parentCategory children megaMenuStatus sortingOrder isNewItem status"
    )
    .lean();

  const map = new Map<string, any>();
  const childIds = new Set<string>();

  allCategories.forEach((cat) => {
    map.set(cat._id.toString(), { ...cat });
    if (cat.parentCategory) childIds.add(cat._id.toString());
    if (cat.children?.length) {
      cat.children.forEach((childId: any) => childIds.add(childId.toString()));
    }
  });

  const buildTree = (cat: any, parentStatus = true, visited = new Set()) => {
    if (visited.has(cat._id.toString())) return null;
    visited.add(cat._id.toString());

    if (!parentStatus || cat.status === false) return null;

    let children: any[] = [];
    allCategories.forEach((c) => {
      if (c.parentCategory?.toString() === cat._id.toString()) {
        const child = buildTree(c, cat.status, visited);
        if (child) {
          if (Array.isArray(child)) {
            children.push(...child);
          } else {
            children.push(child);
          }
        }
      }
    });

    if (cat.children?.length) {
      cat.children.forEach((childId: any) => {
        if (map.has(childId.toString())) {
          const child = buildTree(
            map.get(childId.toString()),
            cat.status,
            visited
          );
          if (child) {
            if (Array.isArray(child)) {
              children.push(...child);
            } else {
              children.push(child);
            }
          }
        }
      });
    }

    const uniqueChildren = Array.from(
      new Map(children.map((c: any) => [c._id.toString(), c])).values()
    );

    uniqueChildren.sort(
      (a, b) => (a.sortingOrder ?? 0) - (b.sortingOrder ?? 0)
    );

    if (cat.level === "parentCategory") cat.categories = uniqueChildren;
    else if (cat.level === "category") cat.subCategories = uniqueChildren;
    else if (cat.level === "subCategory") cat.subSubCategories = uniqueChildren;

    const hasSubmenu =
      (cat.categories?.length ?? 0) > 0 ||
      (cat.subCategories?.length ?? 0) > 0 ||
      (cat.subSubCategories?.length ?? 0) > 0;

    const node = {
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      level: cat.level,
      megaMenuStatus: cat.megaMenuStatus ?? false,
      isNewItem: cat.isNewItem ?? true,
      status: cat.status ?? true,
      sortingOrder: cat.sortingOrder ?? 1,
      hasSubmenu,
      ...(cat.categories?.length ? { categories: cat.categories } : {}),
      ...(cat.subCategories?.length
        ? { subCategories: cat.subCategories }
        : {}),
      ...(cat.subSubCategories?.length
        ? { subSubCategories: cat.subSubCategories }
        : {}),
    };

    if (cat.megaMenuStatus === false) {
      return uniqueChildren.length ? uniqueChildren : null;
    }

    return node;
  };

  const rootCategories = allCategories.filter(
    (cat) => !childIds.has(cat._id.toString())
  );

  const nested: any[] = [];
  rootCategories.forEach((root) => {
    const tree = buildTree(root);
    if (tree) {
      if (Array.isArray(tree)) nested.push(...tree);
      else nested.push(tree);
    }
  });

  return nested;
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
    deleteFileSync(existingCategory.attachment as string);
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

  await applyRoleDiscountsToProducts(updatedCategory._id.toString());

  return updatedCategory;
};

const updateCategoryOrderService = async (
  categoryId: string,
  newOrder: number
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const category = await categoryModel.findById(categoryId).session(session);
    if (!category) throw new Error("Category not found");

    const oldOrder = category.sortingOrder;

    if (oldOrder === newOrder) {
      await session.commitTransaction();
      session.endSession();
      return category;
    }

    const increment = oldOrder < newOrder ? -1 : 1;
    const rangeQuery =
      oldOrder < newOrder
        ? { $gt: oldOrder, $lte: newOrder }
        : { $lt: oldOrder, $gte: newOrder };

    await categoryModel.updateMany(
      { _id: { $ne: category._id }, sortingOrder: rangeQuery },
      { $inc: { sortingOrder: increment } },
      { session }
    );

    await categoryModel.updateOne(
      { _id: category._id },
      { $set: { sortingOrder: newOrder } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return await categoryModel.findById(category._id);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
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
    deleteFileSync(category.attachment as string);
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
  getNestedCategoriesService,
  updateSingleCategoryService,
  updateCategoryOrderService,
  deleteSingleCategoryService,
  deleteManyCategoriesService,
};
