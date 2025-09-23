import { Types } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  parentCategory?: Types.ObjectId | null;
  category?: Types.ObjectId | null;
  subCategory?: Types.ObjectId | null;
  subSubCategory?: Types.ObjectId | null;
  level: "parentCategory" | "category" | "subCategory" | "subSubCategory";
  discountType: "fixed" | "percentage";
  discountValue: number;
  attachment: string;
  status: boolean;
}
