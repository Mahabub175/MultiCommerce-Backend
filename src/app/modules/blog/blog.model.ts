import { Schema, model } from "mongoose";
import { IBlog } from "./blog.interface";

const blogSchema = new Schema<IBlog>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    publishedAt: { type: String, required: true, trim: true },
    attachment: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const blogModel = model<IBlog>("blog", blogSchema);
