import { categoryModel } from "../modules/category/category.model";

export const updateMegaMenuStatus = async (
  categoryId: string,
  status: boolean
): Promise<void> => {
  await categoryModel.updateOne(
    { _id: categoryId },
    { megaMenuStatus: status }
  );

  const childCategories = await categoryModel.find({
    $or: [
      { parentCategory: categoryId },
      { categories: categoryId },
      { subcategories: categoryId },
      { subSubCategories: categoryId },
      { children: categoryId },
    ],
  });

  for (const child of childCategories) {
    await updateMegaMenuStatus(child._id.toString(), status);
  }
};
