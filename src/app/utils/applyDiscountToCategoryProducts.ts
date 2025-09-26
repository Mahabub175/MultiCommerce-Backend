import { categoryModel } from "../modules/category/category.model";
import { productModel } from "../modules/product/product.model";

export const applyDiscountToCategoryProducts = async (categoryId: any) => {
  const category = await categoryModel.findById(categoryId).lean();

  if (!category || !category.discountType || !category.discountValue) {
    return;
  }

  const { discountType, discountValue } = category;

  await productModel.updateMany({ category: categoryId }, [
    {
      $set: {
        categoryDiscountPrice: {
          $cond: [
            { $eq: [discountType, "percentage"] },
            {
              $max: [
                {
                  $subtract: [
                    "$sellingPrice",
                    {
                      $divide: [
                        { $multiply: ["$sellingPrice", discountValue] },
                        100,
                      ],
                    },
                  ],
                },
                0,
              ],
            },
            {
              $max: [{ $subtract: ["$sellingPrice", discountValue] }, 0],
            },
          ],
        },
      },
    },
  ]);

  const childCategories = await categoryModel
    .find({
      $or: [
        { parentCategory: categoryId },
        { category: categoryId },
        { subCategory: categoryId },
        { subSubCategory: categoryId },
      ],
    })
    .lean();

  for (const child of childCategories) {
    await applyDiscountToCategoryProducts(child._id.toString());
  }
};
