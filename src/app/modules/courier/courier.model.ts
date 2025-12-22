import { Schema, model } from "mongoose";
import { ICourier } from "./courier.interface";

const courierSchema = new Schema<ICourier>(
  {
    courierName: { type: String, required: true, trim: true, unique: true },
    attachment: { type: String },
    shippingSlots: [
      {
        slotName: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        basePrice: { type: Number },
        additionalPricePerKm: { type: Number, default: 0 },
        maxOrders: { type: Number, default: 50 },
        perKmPrice: { type: Number },
        estimatedDeliveryTime: { type: Number },
        status: { type: Boolean, default: true },
        // New fields for dynamic pricing
        weightMultiplier: { type: Number, default: 0 }, // Cost per unit weight
        weightUnit: { type: String, enum: ["kg", "100g"], default: "kg" },
        dimensionMultiplier: { type: Number, default: 0 }, // Cost per unit volume
        dimensionUnit: { type: String, enum: ["cm3", "1000cm3"] },
        useDimensionalPricing: { type: Boolean, default: false }, // NEW FIELD
        useDimensionalWeight: { type: Boolean, default: false },
        dimensionalWeightDivisor: { type: Number, default: 5000 },
      },
    ],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const courierModel = model<ICourier>("courier", courierSchema);
