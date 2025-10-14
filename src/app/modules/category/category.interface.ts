import { Types } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  parentCategory?: Types.ObjectId | null;
  category?: Types.ObjectId | null;
  subCategory?: Types.ObjectId | null;
  subSubCategory?: Types.ObjectId | null;
  level: "parentCategory" | "category" | "subCategory" | "subSubCategory";
  roles: Types.ObjectId[];
  attachment: string;
  megaMenuStatus: boolean;
  status: boolean;
}
