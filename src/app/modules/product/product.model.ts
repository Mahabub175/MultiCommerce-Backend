import { model, Schema, Types } from "mongoose";
import {
  IProduct,
  IReview,
  IVariant,
  IRoleDiscount,
  ICategoryDiscount,
} from "./product.interface";

const variantSchema = new Schema<IVariant>({
  sku: { type: String, required: true },
  attributeCombination: [
    {
      type: Types.ObjectId,
      ref: "attributeOption",
      required: true,
    },
  ],
  sellingPrice: { type: Number },
  buyingPrice: { type: Number },
  offerPrice: { type: Number },
  stock: { type: Number, required: true },
  images: [{ type: String }],
});

const reviewSchema = new Schema<IReview>(
  {
    comment: { type: String, trim: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    rating: { type: Number, required: true },
    attachment: [{ type: String }],
  },
  { timestamps: true }
);

const roleDiscountSchema = new Schema<IRoleDiscount>(
  {
    role: { type: Schema.Types.ObjectId, ref: "role" },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    discountedPrice: { type: Number },
  },
  { _id: false }
);

const categoryDiscountSchema = new Schema<ICategoryDiscount>(
  {
    category: { type: Schema.Types.ObjectId, ref: "category", required: true },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    discountedPrice: { type: Number },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    mainImage: { type: String },
    video: { type: String },
    brand: { type: Schema.Types.ObjectId, ref: "brand" },
    category: { type: Schema.Types.ObjectId, ref: "category", required: true },
    productModel: { type: String },
    images: { type: [String] },
    sellingPrice: { type: Number },
    weight: { type: Number },
    purchasePoint: { type: Number },
    unit: { type: String },
    buyingPrice: { type: Number },
    offerPrice: { type: Number },
    categoryDiscountPrice: { type: Number },
    stock: { type: Number },
    totalSold: { type: Number, default: 0 },
    isVariant: { type: Boolean, default: false },
    variants: { type: [variantSchema], default: [] },
    tags: { type: [String], default: [] },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    reviews: { type: [reviewSchema], default: [] },
    roleDiscounts: { type: [roleDiscountSchema], default: [] },
    categoryDiscounts: { type: [categoryDiscountSchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isTopRated: { type: Boolean, default: false },
    isRecent: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  const product = this as IProduct;

  if (!product.sellingPrice) return next();

  const calculateDiscountedPrice = (
    basePrice: number,
    discountType: "fixed" | "percentage",
    discountValue: number
  ): number => {
    let finalPrice = basePrice;

    if (discountType === "fixed") {
      finalPrice = basePrice - discountValue;
    } else if (discountType === "percentage") {
      finalPrice = basePrice - (basePrice * discountValue) / 100;
    }

    return Math.max(finalPrice, 0);
  };

  if (
    Array.isArray(product.roleDiscounts) &&
    product.roleDiscounts.length > 0
  ) {
    product.roleDiscounts = product.roleDiscounts.map((discount) => ({
      ...discount,
      discountedPrice: calculateDiscountedPrice(
        product.sellingPrice!,
        discount.discountType,
        discount.discountValue
      ),
    }));
  }

  if (
    Array.isArray(product.categoryDiscounts) &&
    product.categoryDiscounts.length > 0
  ) {
    product.categoryDiscounts = product.categoryDiscounts.map((discount) => ({
      ...discount,
      discountedPrice: calculateDiscountedPrice(
        product.sellingPrice!,
        discount.discountType,
        discount.discountValue
      ),
    }));
  }

  next();
});

export const productModel = model<IProduct>("product", productSchema);
