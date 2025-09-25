import { model, Schema } from "mongoose";
import { ICart } from "./cart.interface";

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "user" },
    deviceId: { type: String, trim: true },
    product: { type: Schema.Types.ObjectId, ref: "product", required: true },
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    weight: { type: Number },
    price: { type: Number, trim: true, required: true },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const cartModel = model<ICart>("cart", cartSchema);
