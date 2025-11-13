import { model, Schema } from "mongoose";
import { IReserveOrder, IReserveOrderProduct } from "./reserveOrder.interface";

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
    totalAmount: { type: Number },
    totalQuantity: { type: Number },
    totalWeight: { type: Number },
    note: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reserveOrderSchema.pre("save", function (next) {
  const reserveOrder = this as IReserveOrder;

  if (reserveOrder.products && reserveOrder.products.length > 0) {
    reserveOrder.totalAmount = reserveOrder.products.reduce(
      (sum, item: IReserveOrderProduct) =>
        sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    reserveOrder.totalQuantity = reserveOrder.products.reduce(
      (sum, item: IReserveOrderProduct) => sum + (item.quantity || 0),
      0
    );

    reserveOrder.totalWeight = reserveOrder.products.reduce(
      (sum, item: IReserveOrderProduct) =>
        sum + (item.weight || 0) * (item.quantity || 1),
      0
    );
  } else {
    reserveOrder.totalAmount = 0;
    reserveOrder.totalQuantity = 0;
    reserveOrder.totalWeight = 0;
  }

  next();
});

export const reserveOrderModel = model<IReserveOrder>(
  "reserveOrder",
  reserveOrderSchema
);
