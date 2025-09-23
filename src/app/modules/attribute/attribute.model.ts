import { model, Schema, Types } from "mongoose";
import { IAttribute } from "./attribute.interface";

const attributeSchema = new Schema<IAttribute>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    options: [
      {
        type: Types.ObjectId,
        ref: "attributeOption",
        required: true,
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
