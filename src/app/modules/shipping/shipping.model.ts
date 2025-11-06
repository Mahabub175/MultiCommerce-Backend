import { Schema, model } from "mongoose";
import { IShippingSlot, IShippingOrder } from "./shipping.interface";

const shippingSlotSchema = new Schema<IShippingSlot>(
  {
    slotName: { type: String, required: true },
    courierName: { type: String },
    attachment: { type: String },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    basePrice: { type: Number, required: true },
    additionalPricePerKm: { type: Number, default: 0 },
    maxOrders: { type: Number, default: 50 },
    perKmPrice: { type: Number, required: true },
    estimatedDeliveryTime: { type: Number, required: true },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const shippingOrderSchema = new Schema<IShippingOrder>(
  {
    order: [{ type: Schema.Types.ObjectId, ref: "order", required: true }],
    user: [{ type: Schema.Types.ObjectId, ref: "user" }],
    shippingSlot: { type: Schema.Types.ObjectId, ref: "shippingSlot" },
    deliveryAddress: {
      name: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      postalCode: String,
      country: String,
      location: {
        lat: Number,
        lng: Number,
      },
    },
    deliveryCharge: { type: Number, required: true },
    expectedDeliveryAt: Date,
    actualDeliveryAt: Date,
    courier: {
      name: String,
      contact: String,
      trackingId: String,
    },
    shippingStatus: {
      type: String,
      enum: ["pending", "dispatched", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
    status: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  { timestamps: true }
);

export const shippingSlotModel = model<IShippingSlot>(
  "shippingSlot",
  shippingSlotSchema
);
export const shippingOrderModel = model<IShippingOrder>(
  "shippingOrder",
  shippingOrderSchema
);
