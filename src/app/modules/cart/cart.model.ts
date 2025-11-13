import { model, Schema } from "mongoose";
import { ICart, ICartProduct } from "./cart.interface";

const cartSchema = new Schema<ICart>(
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

cartSchema.pre("save", function (next) {
  const cart = this as ICart;

  if (cart.products && cart.products.length > 0) {
    cart.totalAmount = cart.products.reduce(
      (sum, item: ICartProduct) =>
        sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    cart.totalQuantity = cart.products.reduce(
      (sum, item: ICartProduct) => sum + (item.quantity || 0),
      0
    );

    cart.totalWeight = cart.products.reduce(
      (sum, item: ICartProduct) =>
        sum + (item.weight || 0) * (item.quantity || 1),
      0
    );
  } else {
    cart.totalAmount = 0;
    cart.totalQuantity = 0;
    cart.totalWeight = 0;
  }

  next();
});

export const cartModel = model<ICart>("cart", cartSchema);
