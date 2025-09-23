import { Schema, model } from "mongoose";
import { IAttributeOption } from "./attributeOption.interface";

const attributeOptionSchema = new Schema<IAttributeOption>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["color", "other"], default: "other" },
    attribute: { type: Schema.Types.ObjectId, ref: "attribute" },
    label: { type: String, trim: true },
    attachment: { type: String },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const attributeOptionModel = model<IAttributeOption>(
  "attributeOption",
  attributeOptionSchema
);
