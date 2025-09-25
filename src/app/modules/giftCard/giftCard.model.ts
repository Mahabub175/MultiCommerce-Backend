import { model, Schema } from "mongoose";
import { IGiftCard } from "./giftCard.interface";

const giftCardSchema = new Schema<IGiftCard>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    user: [{ type: Schema.Types.ObjectId, ref: "user" }],
    count: { type: Number, default: 1 },
    amount: { type: String, required: true, trim: true },
    attachment: { type: String, trim: true },
    expiredDate: { type: String, required: true, trim: true },
    status: {
      type: Boolean,
      default: true,
    },
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

export const giftCardModel = model<IGiftCard>("giftCard", giftCardSchema);
