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
