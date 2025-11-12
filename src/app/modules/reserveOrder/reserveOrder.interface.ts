import { Types } from "mongoose";

export interface IReserveOrderProduct {
  product: Types.ObjectId;
  sku: string;
  quantity: number;
  weight?: number;
  price: number;
}

export interface IReserveOrder {
  user?: Types.ObjectId;
  deviceId?: string;
  products: IReserveOrderProduct[];
  status: boolean;
}
