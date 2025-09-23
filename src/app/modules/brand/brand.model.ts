import { Schema, model } from "mongoose";
import { IBrand } from "./brand.interface";

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true },
    attachment: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const brandModel = model<IBrand>("brand", brandSchema);
