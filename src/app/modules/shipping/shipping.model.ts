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
    attachment: { type: String},
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
    shippingSlot: { type: Schema.Types.ObjectId, ref: "shippingSlot" },
    deliveryList: [
      {
        order: { type: Schema.Types.ObjectId, ref: "order", required: true },
        charge: Number,
        status: {
          type: String,
          enum: [
            "pending",
            "dispatched",
            "in_transit",
            "delivered",
            "cancelled",
            "returned",
          ],
          default: "pending",
        },
        returnRequested: { type: Boolean, default: false },
        returnStatus: {
          type: String,
          enum: ["none", "pending", "accepted", "rejected"],
          default: "none",
        },
        returnReason: { type: String, default: "" },
        returnNote: { type: String, default: "" },
        progress: [
          {
            status: String,
            note: String,
            updatedAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    note: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
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
