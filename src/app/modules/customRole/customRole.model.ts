import { Schema, model } from "mongoose";
import { ICustomRole } from "./customRole.interface";

const customRoleSchema = new Schema<ICustomRole>(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
    },
    discountValue: {
      type: Number,
    },
    minimumQuantity: {
      type: Number,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const customRoleModel = model<ICustomRole>(
  "customRole",
  customRoleSchema
);
