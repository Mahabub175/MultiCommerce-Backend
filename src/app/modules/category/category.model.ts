import { Schema, model } from "mongoose";
import { ICategory } from "./category.interface";

export enum CategoryLevel {
  PARENT_CATEGORY = "parentCategory",
  CATEGORY = "category",
  SUB_CATEGORY = "subCategory",
  SUB_SUB_CATEGORY = "subSubCategory",
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "category",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "category",
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "category",
    },
    subSubCategory: {
      type: Schema.Types.ObjectId,
      ref: "category",
    },
    level: {
      type: String,
      enum: Object.values(CategoryLevel),
      default: CategoryLevel.PARENT_CATEGORY,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
    },
    discountValue: {
      type: Number,
    },
    attachment: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const categoryModel = model<ICategory>("category", categorySchema);
