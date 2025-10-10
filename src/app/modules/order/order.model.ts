import { model, Schema } from "mongoose";
import { IOrder } from "./order.interface";

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  variant: { type: String },
});

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const paymentInfoSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["paypal", "stripe", "cash_on_delivery", "manual", "points"],
      required: true,
    },
    transactionId: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentInfo: { type: paymentInfoSchema, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    coupon: { type: Schema.Types.ObjectId, ref: "coupon" },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    note: { type: String },
    status: { Boolean, default: true },
  },
  { timestamps: true }
);

export const orderModel = model<IOrder>("order", orderSchema);
