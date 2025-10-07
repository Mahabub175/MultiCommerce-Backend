import { model, Schema, Document } from "mongoose";
import { IGiftCard } from "./giftCard.interface";

const giftCardSchema = new Schema<IGiftCard>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    user: [{ type: Schema.Types.ObjectId, ref: "user", required: false }],
    count: { type: Number, default: 0 },
    maxUsageCount: { type: Number, default: 1 },
    amount: { type: Number, required: true },
    attachment: { type: String, trim: true },
    expiredDate: { type: Date, required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

giftCardSchema.pre("validate", function (next) {
  if (!this.code) {
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    this.code = `VGC-${randomNumbers}`;
  }
  next();
});

giftCardSchema.methods.isExpired = function (): boolean {
  return new Date(this.expiredDate).getTime() < Date.now();
};

giftCardSchema.methods.isMaxUsed = function (): boolean {
  return this.count >= this.maxUsageCount;
};

giftCardSchema.methods.isValidForUser = function (userId: string): {
  valid: boolean;
  reason?: string;
} {
  if (!this.status) return { valid: false, reason: "Gift card is inactive." };
  if (this.isExpired())
    return { valid: false, reason: "Gift card has expired." };
  if (this.isMaxUsed())
    return { valid: false, reason: "Gift card usage limit reached." };
  if (
    this.user?.length &&
    !this.user.some((id: any) => id.toString() === userId)
  )
    return { valid: false, reason: "You are not eligible for this gift card." };
  return { valid: true };
};

giftCardSchema.methods.incrementUsage = async function (): Promise<void> {
  this.count += 1;
  await this.save();
};

export const giftCardModel = model<IGiftCard>("giftCard", giftCardSchema);
