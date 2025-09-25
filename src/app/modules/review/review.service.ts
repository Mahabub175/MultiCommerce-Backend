import { paginateAndSort } from "../../utils/paginateAndSort";
import { recalculateProductRatings } from "../../utils/recalculateProductRatings";
import { IReview } from "../product/product.interface";
import { productModel } from "../product/product.model";

const addReviewToProductService = async (
  productId: string,
  reviewData: IReview
) => {
  const product = await productModel.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  product.reviews.push(reviewData as any);
  await product.save();

  await recalculateProductRatings(product._id as string);

  return product;
};

const getAllReviewsService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  const query = productModel
    .find()
    .populate("reviews.user")
    .select(
      "reviews.user reviews._id reviews.comment reviews.rating _id name slug"
    );

  if (page && limit) {
    const results = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    return results;
  } else {
    const results = await query.sort({ "reviews.createdAt": -1 }).exec();
    return {
      results,
    };
  }
};

const getReviewsByUserService = async (
  userId: string,
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  const query = productModel
    .find({ "reviews.user": userId })
    .populate("reviews.user")
    .select(
      "reviews.user reviews._id reviews.comment reviews.rating _id name slug"
    );

  if (page && limit) {
    const results = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    return results;
  } else {
    const results = await query.sort({ "reviews.createdAt": -1 }).exec();
    return {
      results,
    };
  }
};

const getSingleReviewService = async (reviewId: string) => {
  const review = await productModel
    .findOne({ "reviews._id": reviewId })
    .populate("reviews.user")
    .select("reviews._id reviews.comment reviews.rating reviews.user");

  if (!review) {
    throw new Error("Review not found");
  }

  const result = review.reviews.find(
    (review) => review._id.toString() === reviewId
  );

  if (!result) {
    throw new Error("Review not found");
  }

  return {
    productId: review._id,
    reviewId: result._id,
    result,
  };
};

const updateProductReviewService = async (
  productId: string,
  reviewId: string,
  updatedData: Partial<IReview>
) => {
  const product = await productModel.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const review = product.reviews.find((rev) => rev._id.toString() === reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  if (updatedData.comment !== undefined) review.comment = updatedData.comment;
  if (updatedData.rating !== undefined) review.rating = updatedData.rating;

  await product.save();

  await recalculateProductRatings(product._id as string);

  return product;
};

const deleteProductReviewService = async (
  productId: string,
  reviewId: string
) => {
  const product = await productModel.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const review = product.reviews.find((rev) => rev._id.toString() === reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  product.reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== reviewId
  );

  await product.save();

  await recalculateProductRatings(product._id as string);

  return product;
};

export const reviewServices = {
  addReviewToProductService,
  getAllReviewsService,
  getReviewsByUserService,
  getSingleReviewService,
  updateProductReviewService,
  deleteProductReviewService,
};
