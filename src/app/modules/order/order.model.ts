import { model, Schema, Model } from "mongoose";
import { IOrder } from "./order.interface";

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  variant: { type: String },
});

const shippingAddressSchema = new Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true },
    label: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    streetAddress: { type: String, trim: true },
    addressSummary: { type: String, trim: true },
  },
  { _id: false }
);

const paymentInfoSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["paypal", "stripe", "cash_on_delivery", "manual", "credit"],
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
    orderId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "user", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema },
    paymentInfo: { type: paymentInfoSchema, required: true },
    subtotal: { type: Number, required: true },
    additionalPayment: { type: Number },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    coupon: { type: Schema.Types.ObjectId, ref: "coupon" },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    note: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const OrderModel = this.constructor as Model<IOrder>;

    const lastOrder = await OrderModel.findOne({}, { orderId: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let newOrderNumber = 1;

    if (lastOrder?.orderId) {
      const lastNum = parseInt(lastOrder.orderId.split("-")[1] || "0", 10);
      newOrderNumber = lastNum + 1;
    }

    this.orderId = `ORD-${newOrderNumber.toString().padStart(5, "0")}`;

    next();
  } catch (error) {
    next(error as any);
  }
});

export const orderModel = model<IOrder>("order", orderSchema);
