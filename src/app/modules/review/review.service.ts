import { formatResultImage } from "../../utils/formatResultImage";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { recalculateProductRatings } from "../../utils/recalculateProductRatings";
import { IReview } from "../product/product.interface";
import { productModel } from "../product/product.model";
import fs from "fs";
import path from "path";

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
      "reviews.user reviews._id reviews.comment reviews.rating reviews.attachment _id name slug"
    );

  let results: any;

  if (page && limit) {
    const paginatedResults = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return paginatedResults;
  } else {
    results = await query.sort({ "reviews.createdAt": -1 }).exec();

    results = formatResultImage(results, "attachment");

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
      "reviews.user reviews._id reviews.comment reviews.rating reviews.attachment _id name slug"
    );
  let results: any;
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
    results = await query.sort({ "reviews.createdAt": -1 }).exec();

    results = formatResultImage(results, "attachment");

    return {
      results,
    };
  }
};

const getSingleReviewService = async (reviewId: string) => {
  const product = await productModel
    .findOne({ "reviews._id": reviewId })
    .populate("reviews.user")
    .select(
      "reviews._id reviews.comment reviews.rating reviews.user reviews.attachment name slug"
    );

  if (!product) {
    throw new Error("Review not found");
  }

  const foundReview = product.reviews.find(
    (rev) => rev._id.toString() === reviewId
  );

  if (!foundReview) {
    throw new Error("Review not found");
  }

  const formattedReview = formatResultImage(foundReview as any, "attachment");

  return {
    productId: product._id,
    productName: product.name,
    slug: product.slug,
    reviewId: foundReview._id,
    review: formattedReview,
  };
};

// Update Product Review
const updateProductReviewService = async (
  productId: string,
  reviewId: string,
  updatedData: Partial<IReview>
) => {
  const product = await productModel.findById(productId);

  if (!product) throw new Error("Product not found");

  const review = product.reviews.find((rev) => rev._id.toString() === reviewId);
  if (!review) throw new Error("Review not found");

  if (updatedData.attachment && updatedData.attachment.length > 0) {
    if (review.attachment && review.attachment.length > 0) {
      for (const fileUrl of review.attachment) {
        const filePath = path.join(
          process.cwd(),
          "uploads",
          path.basename(fileUrl)
        );
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.warn(`Failed to delete old review attachment: ${filePath}`);
          }
        }
      }
    }
    review.attachment = updatedData.attachment;
  }

  if (updatedData.comment !== undefined) review.comment = updatedData.comment;
  if (updatedData.rating !== undefined) review.rating = updatedData.rating;

  await product.save();
  await recalculateProductRatings(product._id as string);

  return product;
};

// Delete Product Review
const deleteProductReviewService = async (
  productId: string,
  reviewId: string
) => {
  const product = await productModel.findById(productId);

  if (!product) throw new Error("Product not found");

  const review = product.reviews.find((rev) => rev._id.toString() === reviewId);
  if (!review) throw new Error("Review not found");

  if (review.attachment && review.attachment.length > 0) {
    for (const fileUrl of review.attachment) {
      const filePath = path.join(
        process.cwd(),
        "uploads",
        path.basename(fileUrl)
      );
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn(`Failed to delete review attachment: ${filePath}`);
        }
      }
    }
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
