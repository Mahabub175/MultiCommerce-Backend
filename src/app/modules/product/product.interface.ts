import { Document, Types } from "mongoose";

export interface IAttribute {
  name: string;
  options: string[];
}

export interface IVariantAttributeCombination {
  attributeName: string;
  optionName: string;
  optionLabel: string;
}

export interface IVariant {
  sku: string;
  attributeCombination: IVariantAttributeCombination[];
  buyingPrice: number;
  regularPrice: number;
  salePrice: number;
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

export interface IGlobalRoleDiscount {
  role: Types.ObjectId;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountedPrice: number;
  minimumQuantity: number;
}

export interface ICategoryRoleDiscount {
  role: Types.ObjectId;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountedPrice: number;
  minimumQuantity: number;
}

export interface IProductRoleDiscount {
  role: Types.ObjectId;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountedPrice: number;
  minimumQuantity: number;
}

export interface ICategoryDiscount {
  category: Types.ObjectId;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountedPrice?: number;
  minimumQuantity: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description: string;
  brand: Types.ObjectId;
  category: Types.ObjectId[];
  unit: string;
  weight: number;
  productModel: string;
  purchasePoint: number;
  mainImage: string;
  images: string[];
  video: string;
  buyingPrice: number;
  regularPrice: number;
  salePrice?: number;
  totalSold: number;
  stock: number;
  isVariant: boolean | "true" | "false";
  variants: IVariant[];
  tags: string[];
  ratings: {
    average: number;
    count: number;
  };
  reviews: IReview[];
  globalRoleDiscounts: IGlobalRoleDiscount[];
  categoryRoleDiscounts: ICategoryRoleDiscount[];
  productRoleDiscounts: IProductRoleDiscount[];
  categoryDiscounts: ICategoryDiscount[];
  isAvailable: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isRecent: boolean;
  status: boolean;
}
