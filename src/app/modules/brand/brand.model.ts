import { Schema, model } from "mongoose";
import { IBrand } from "./brand.interface";

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String },
    attachment: { type: String, required: true },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const brandModel = model<IBrand>("brand", brandSchema);
