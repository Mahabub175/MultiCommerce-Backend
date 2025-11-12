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
    role: { type: Schema.Types.ObjectId, ref: "customRole" },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
    },
    minimumQuantity: { type: Number },
    discountValue: { type: Number },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      unique: true,
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
    categories: [{ type: Schema.Types.ObjectId, ref: "category" }],
    subCategories: [{ type: Schema.Types.ObjectId, ref: "category" }],
    subSubCategories: [{ type: Schema.Types.ObjectId, ref: "category" }],
    level: {
      type: String,
      enum: Object.values(CategoryLevel),
      default: CategoryLevel.PARENT_CATEGORY,
    },
    children: [{ type: Schema.Types.ObjectId, ref: "category" }],
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
    isNewItem: {
      type: Boolean,
      default: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    sortingOrder: {
      type: Number,
    },
  },
  { timestamps: true }
);

categorySchema.pre("save", async function (next) {
  if (this.isNew && !this.sortingOrder) {
    const lastCategory = await categoryModel
      .findOne()
      .sort({ sortingOrder: -1 });
    this.sortingOrder = lastCategory ? lastCategory.sortingOrder + 1 : 1;
  }
  next();
});

export const categoryModel = model<ICategory>("category", categorySchema);
