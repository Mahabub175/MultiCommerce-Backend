import { model, Schema } from "mongoose";
import { IAttribute } from "./attribute.interface";

const attributeSchema = new Schema<IAttribute>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    options: [
      {
        name: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const attributeModel = model<IAttribute>("attribute", attributeSchema);
