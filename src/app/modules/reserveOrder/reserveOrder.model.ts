import { model, Schema } from "mongoose";
import { IReserveOrder } from "./reserveOrder.interface";

const reserveOrderSchema = new Schema<IReserveOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "user" },
    deviceId: { type: String, trim: true },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        sku: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true },
        weight: { type: Number },
        price: { type: Number, required: true },
      },
    ],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const reserveOrderModel = model<IReserveOrder>(
  "reserveOrder",
  reserveOrderSchema
);
