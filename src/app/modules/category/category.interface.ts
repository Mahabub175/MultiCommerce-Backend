import { Types } from "mongoose";

export interface ICategoryRoleDiscount {
  role: Types.ObjectId;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumQuantity: number;
  status: boolean;
}

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parentCategory?: Types.ObjectId | null;
  categories?: Types.ObjectId[] | null;
  subCategories?: Types.ObjectId[] | null;
  subSubCategories?: Types.ObjectId[];
  level: "parentCategory" | "category" | "subCategory" | "subSubCategory";
  children?: ICategory[];
  roleDiscounts?: ICategoryRoleDiscount[];
  minimumQuantity: number;
  discountType: "fixed" | "percentage";
  discountValue: number;
  productsCount: number;
  attachment?: string;
  megaMenuStatus?: boolean;
  sortingOrder: number;
  isFeatured: boolean;
  isNewItem: boolean;
  status: boolean;
}
