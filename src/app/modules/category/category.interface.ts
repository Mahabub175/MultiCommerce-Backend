import { Types } from "mongoose";

export interface ICategoryRoleDiscount {
  role: Types.ObjectId;
  discountType: "fixed" | "percentage";
  discountValue: number;
}

export interface ICategory {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  parentCategory?: Types.ObjectId | null;
  category?: Types.ObjectId | null;
  subCategory?: Types.ObjectId | null;
  subSubCategory?: Types.ObjectId | null;
  level: "parentCategory" | "category" | "subCategory" | "subSubCategory";
  roleDiscounts?: ICategoryRoleDiscount[];
  minimumQuantity: number;
  discountType: "fixed" | "percentage";
  discountValue: number;
  attachment?: string;
  megaMenuStatus?: boolean;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
