import { Document, Types } from "mongoose";

export interface IAttribute {
  name: string;
  options: string[];
}

export interface IVariant {
  sku: string;
  attributeCombination: Types.ObjectId[];
  buyingPrice: number;
  sellingPrice: number;
  offerPrice: number;
  stock: number;
  images: string[];
}

export interface IReview {
  _id: Types.ObjectId;
  comment: string;
  user: Types.ObjectId;
  rating: number;
  attachment: string[];
}

export interface IRoleDiscount {
  role: Types.ObjectId;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountedPrice: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description: string;
  brand: Types.ObjectId;
  category: Types.ObjectId;
  unit: string;
  weight: number;
  productModel: string;
  purchasePoint: number;
  mainImage: string;
  images: string[];
  video: string;
  buyingPrice: number;
  sellingPrice: number;
  offerPrice: number;
  categoryDiscountPrice: number;
  totalSold: number;
  stock: number;
  isVariant: boolean;
  variants: IVariant[];
  tags: string[];
  ratings: {
    average: number;
    count: number;
  };
  reviews: IReview[];
  roleDiscounts: IRoleDiscount[];
  isAvailable: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isRecent: boolean;
  status: boolean;
}
