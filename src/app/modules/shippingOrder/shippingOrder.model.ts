import { model, Schema } from "mongoose";
import { IShippingOrder } from "./shippingOrder.interface";

const shippingOrderSchema = new Schema<IShippingOrder>(
  {
    shippingSlot: {
      type: Schema.Types.ObjectId,
      ref: "shippingSlot",
      required: true,
    },
    selectedSlot: {
      type: Schema.Types.ObjectId,
      required: true,
    },
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

export const shippingOrderModel = model<IShippingOrder>(
  "shippingOrder",
  shippingOrderSchema
);
