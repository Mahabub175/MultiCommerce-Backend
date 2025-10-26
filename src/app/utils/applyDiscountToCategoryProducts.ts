import mongoose from "mongoose";
import { categoryModel } from "../modules/category/category.model";
import { productModel } from "../modules/product/product.model";

export const applyCategoryDiscountToProducts = async (
  categoryId: string,
  discountType: "fixed" | "percentage",
  discountValue: number
) => {
  await productModel.updateMany(
    { category: categoryId },
    {
      $push: {
        categoryDiscounts: {
          category: categoryId,
          discountType,
          discountValue,
          discountedPrice: 0,
        },
      },
    }
  );

  const products = await productModel.find({ category: categoryId });
  for (const product of products) {
    await product.save();
  }
};

export const applyRoleDiscountsToProducts = async (categoryId: string) => {
  const category = await categoryModel.findById(categoryId).lean();
  if (!category) return;

  const activeRoleDiscounts =
    category.roleDiscounts?.filter((r) => r.status === true) || [];
  const inactiveRoleDiscounts =
    category.roleDiscounts?.filter((r) => r.status === false) || [];

  if (inactiveRoleDiscounts.length > 0) {
    const inactiveRoleIds = inactiveRoleDiscounts.map(
      (r) => new mongoose.Types.ObjectId(r.role)
    );
    await productModel.updateMany(
      { category: categoryId },
      { $pull: { categoryRoleDiscounts: { role: { $in: inactiveRoleIds } } } }
    );
  }

  if (activeRoleDiscounts.length > 0) {
    await productModel.updateMany(
      { category: categoryId },
      {
        $addToSet: {
          categoryRoleDiscounts: {
            $each: activeRoleDiscounts.map((d) => ({
              role: d.role,
              discountType: d.discountType,
              discountValue: d.discountValue,
              minimumQuantity: d.minimumQuantity,
            })),
          },
        },
      }
    );
  }

  const products = await productModel.find({ category: categoryId });
  for (const product of products) {
    await product.save();
  }
};
