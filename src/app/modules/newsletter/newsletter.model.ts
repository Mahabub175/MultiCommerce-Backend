import { model, Schema } from "mongoose";
import { INewsletter } from "./newsletter.interface";

const newsletterSchema = new Schema<INewsletter>(
  {
    email: { type: String, required: true, unique: true, trim: true },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const newsletterModel = model<INewsletter>(
  "newsletter",
  newsletterSchema
);
