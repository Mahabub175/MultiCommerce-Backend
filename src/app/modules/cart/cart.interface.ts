import { Types } from "mongoose";

export interface ICartProduct {
  product: Types.ObjectId | any;
  sku: string;
  quantity: number;
  weight?: number;
  price: number;
}

export interface ICart {
  user?: Types.ObjectId;
  deviceId?: string;
  products: ICartProduct[];
  totalAmount: number;
  totalWeight: number;
  totalQuantity: number;
  note: string;
  status: boolean;
}
