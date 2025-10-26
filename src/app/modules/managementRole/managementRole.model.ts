import { Schema, model } from "mongoose";
import { IManagementRole } from "./managementRole.interface";

const roleSchema = new Schema<IManagementRole>(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const managementRoleModel = model<IManagementRole>(
  "managementRole",
  roleSchema
);
