import { Schema, model } from "mongoose";
import { ICategory } from "./category.interface";

export enum CategoryLevel {
  PARENT_CATEGORY = "parentCategory",
  CATEGORY = "category",
  SUB_CATEGORY = "subCategory",
  SUB_SUB_CATEGORY = "subSubCategory",
}

const categoryRoleDiscountSchema = new Schema(
  {
    role: { type: Schema.Types.ObjectId, ref: "role", required: true },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    minimumQuantity: { type: Number },
    discountValue: { type: Number},
  },
  { _id: false }
);

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    subSubCategory: {
      type: Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    level: {
      type: String,
      enum: ["parentCategory", "category", "subCategory", "subSubCategory"],
      required: true,
    },
    roleDiscounts: {
      type: [categoryRoleDiscountSchema],
      default: [],
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
    },
    discountValue: { type: Number },
    minimumQuantity: { type: Number },
    attachment: {
      type: String,
    },
    megaMenuStatus: {
      type: Boolean,
      default: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const categoryModel = model<ICategory>("category", categorySchema);
