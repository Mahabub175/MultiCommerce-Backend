import { Types } from "mongoose";

export interface ICoupon {
  name: string;
  code: string;
  user: Types.ObjectId[];
  count: number;
  amount: string;
  minimumAmount: number;
  expiredDate: string;
  type: string;
  attachment: string;
  status: boolean;
}
