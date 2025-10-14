import { categoryModel } from "../modules/category/category.model";
import { productModel } from "../modules/product/product.model";
import { roleModel } from "../modules/role/role.model";

export const applyDiscountToCategoryProducts = async (categoryId: any) => {
  const category = await categoryModel
    .findById(categoryId)
    .populate("roles")
    .lean();
  if (!category || !category.roles || category.roles.length === 0) return;

  const roles = category.roles as any[];
  const products = await productModel.find({ category: categoryId }).lean();
  if (products.length === 0) return;

  for (const role of roles) {
    const { _id: roleId, discountType, discountValue } = role;
    await productModel.updateMany({ category: categoryId }, [
      {
        $set: {
          [`roleDiscounts.${roleId}`]: {
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
  }

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
