import { Types } from "mongoose";

export interface IGiftCard {
  name: string;
  code: string;
  user: Types.ObjectId[];
  count: number;
  amount: string;
  expiredDate: string;
  attachment?: string;
  status: boolean;
}
