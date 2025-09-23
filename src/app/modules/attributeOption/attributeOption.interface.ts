import { Types } from "mongoose";

export interface IAttributeOption {
  name: string;
  type: string;
  attribute: Types.ObjectId;
  label: string;
  attachment: string;
  status: boolean;
}
