import { Schema, model } from "mongoose";
import { IShippingSlot, IShippingOrder } from "./shipping.interface";

const shippingSlotSchema = new Schema<IShippingSlot>(
  {
    slotName: { type: String },
    courierName: { type: String },
    attachment: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    basePrice: { type: Number },
    additionalPricePerKm: { type: Number, default: 0 },
    maxOrders: { type: Number, default: 50 },
    perKmPrice: { type: Number },
    estimatedDeliveryTime: { type: Number },
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
    deliveryCharge: { type: Number },
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
