import { Types } from "mongoose";

export interface IReserveOrder {
  product: Types.ObjectId;
  sku: string;
  user: Types.ObjectId;
  deviceId: string;
  quantity: number;
  weight: number;
  price: number;
  status: boolean;
}
