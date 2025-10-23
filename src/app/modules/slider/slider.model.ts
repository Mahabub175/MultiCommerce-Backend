import { Schema, model } from "mongoose";
import { ISlider } from "./slider.interface";

const sliderSchema = new Schema<ISlider>(
  {
    name: { type: String },
    buttonText: { type: String },
    promotionalBanner: { type: Boolean, default: false },
    attachment: { type: String },
    video: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const sliderModel = model<ISlider>("slider", sliderSchema);
