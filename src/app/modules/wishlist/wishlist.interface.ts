import { Types } from "mongoose";

export interface IWishlist {
  product: Types.ObjectId;
  user: Types.ObjectId;
  deviceId: string;
  status: boolean;
}
