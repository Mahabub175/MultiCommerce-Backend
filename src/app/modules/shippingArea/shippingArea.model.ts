import mongoose, { Schema, model } from "mongoose";
import { IShippingArea } from "./shippingArea.interface";

const shippingAreaSchema = new Schema<IShippingArea>(
  {
    areaName: { type: String, required: true, trim: true },
    cities: [{ type: String, trim: true }],
    zipCodes: [{ type: String, trim: true }],
    basePrice: { type: Number, required: true, min: 0 },
    priceMultiplier: { type: Number, default: 1, min: 0 },
    isDefault: { type: Boolean, default: false }, // Default "other areas" price
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure only one default area exists
shippingAreaSchema.pre("save", async function (next) {
  try {
    if (this.isDefault && this.isModified("isDefault")) {
      // Set all other areas to isDefault = false
      await (this.constructor as mongoose.Model<IShippingArea>).updateMany(
        { _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

export const shippingAreaModel = model<IShippingArea>(
  "shippingArea",
  shippingAreaSchema
);
