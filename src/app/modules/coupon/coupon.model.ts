import { model, Schema } from "mongoose";
import { ICoupon } from "./coupon.interface";

const couponSchema = new Schema<ICoupon>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    amount: { type: Number, required: true },
    maxAmount: { type: Number, default: 0 },
    minimumAmount: { type: Number, required: true },
    expiredDate: { type: Date, required: true },
    count: { type: Number, default: 0 },
    maxUsageCount: { type: Number, default: 1 },
    attachment: { type: String, trim: true },
    user: [{ type: Schema.Types.ObjectId, ref: "user", required: false }],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.pre("validate", function (next) {
  if (!this.code) {
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    this.code = `VC-${randomNumbers}`;
  }
  next();
});

couponSchema.methods.isExpired = function () {
  return new Date(this.expiredDate).getTime() < Date.now();
};

couponSchema.methods.isMaxUsed = function () {
  return this.count >= this.maxUsageCount;
};

couponSchema.methods.isValidForUser = function (
  userId: string,
  orderAmount: number
) {
  if (!this.status) return { valid: false, reason: "Coupon is inactive." };
  if (this.isExpired()) return { valid: false, reason: "Coupon has expired." };
  if (this.isMaxUsed())
    return { valid: false, reason: "Maximum usage reached." };
  if (orderAmount < this.minimumAmount)
    return {
      valid: false,
      reason: `Minimum order amount is ${this.minimumAmount}.`,
    };
  if (
    this.user?.length &&
    !this.user.some((id: any) => id.toString() === userId)
  )
    return { valid: false, reason: "You are not eligible for this coupon." };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderAmount: number) {
  let discount = 0;
  if (this.type === "fixed") {
    discount = this.amount;
  } else if (this.type === "percentage") {
    discount = (orderAmount * this.amount) / 100;
    if (this.maxAmount && discount > this.maxAmount) {
      discount = this.maxAmount;
    }
  }
  if (discount > orderAmount) discount = orderAmount;
  return Math.round(discount);
};

couponSchema.methods.incrementUsage = async function () {
  this.count += 1;
  await this.save();
};

export const couponModel = model<ICoupon>("coupon", couponSchema);
