import { Schema, model } from "mongoose";
import { IGallery } from "./gallery.interface";

const gallerySchema = new Schema<IGallery>(
  {
    name: { type: String },
    isFeatured: { type: Boolean, default: false },
    attachment: { type: String, required: true },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const galleryModel = model<IGallery>("gallery", gallerySchema);
