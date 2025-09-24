import { brandModel } from "../modules/brand/brand.model";
import { categoryModel } from "../modules/category/category.model";

export const findOrCreateCategory = async (name: string) => {
  if (!name) {
    throw new Error("Category name is required");
  }

  const category = await categoryModel.findOneAndUpdate(
    { name },
    { name },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return category;
};

export const findOrCreateBrand = async (name: string) => {
  if (!name) {
    throw new Error("Brand name is required");
  }

  const brand = await brandModel.findOneAndUpdate(
    { name },
    { name },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return brand;
};
