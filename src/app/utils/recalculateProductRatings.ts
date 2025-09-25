import { productModel } from "../modules/product/product.model";

export const recalculateProductRatings = async (productId: string) => {
  const product = await productModel.findById(productId).select("reviews");

  if (!product) {
    throw new Error("Product not found");
  }

  const reviews = product.reviews || [];

  const totalRating = reviews.reduce(
    (sum, review) => sum + (Number(review.rating) || 0),
    0
  );
  const count = reviews.length;
  const average = count > 0 ? parseFloat((totalRating / count).toFixed(2)) : 0;

  product.ratings = { average, count };
  await product.save();

  return product;
};
