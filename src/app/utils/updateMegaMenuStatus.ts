import { categoryModel } from "../modules/category/category.model";

export const updateMegaMenuStatus = async (
  categoryId: string,
  status: boolean
) => {
  await categoryModel.updateOne(
    { _id: categoryId },
    { megaMenuStatus: status }
  );

  const childCategories = await categoryModel.find({
    $or: [
      { parentCategory: categoryId },
      { category: categoryId },
      { subCategory: categoryId },
      { subSubCategory: categoryId },
    ],
  });

  for (const child of childCategories) {
    await updateMegaMenuStatus(child._id.toString(), status);
  }
};
