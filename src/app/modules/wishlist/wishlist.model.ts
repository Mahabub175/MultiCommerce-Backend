import { model, Schema } from "mongoose";
import { IWishlist } from "./wishlist.interface";

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "user" },
    product: { type: Schema.Types.ObjectId, ref: "product", required: true },
    deviceId: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const wishlistModel = model<IWishlist>("wishlist", wishlistSchema);
