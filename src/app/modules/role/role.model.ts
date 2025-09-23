import { Schema, model } from "mongoose";
import { IRole } from "./role.interface";

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
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
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const roleModel = model<IRole>("role", roleSchema);
