import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";
import { managementRoleModel } from "../managementRole/managementRole.model";
import { customRoleModel } from "../customRole/customRole.model";

const previousPasswordSchema = new Schema({
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    profileImage: String,
    address: String,
    credit: {
      type: Number,
      min: 0,
      set: (v: number) => parseInt(v.toString(), 10),
    },
    limit: {
      type: Number,
      min: 0,
    },
    minimumAmount: {
      type: Number,
      min: 0,
      set: (v: number) => parseInt(v.toString(), 10),
    },
    point: { type: Number, set: (v: number) => parseInt(v.toString(), 10) },
    phoneNumber: { type: String, required: true, unique: true },
    role: {
      type: Schema.Types.ObjectId,
      refPath: "roleModel",
    },
    roleModel: {
      type: String,
      required: true,
      enum: ["managementRole", "customRole"],
      default: "customRole",
    },
    city: String,
    zipCode: String,
    streetAddress1: String,
    streetAddress2: String,
    city2: String,
    zipCode2: String,
    otp: { type: String, trim: true, default: "0000" },
    otpGeneratedAt: { type: String, trim: true },
    defaultPassword: {
      type: String,
      trim: true,
      default: function () {
        return this.phoneNumber;
      },
    },
    previousPasswords: [previousPasswordSchema],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.userName) {
    const first = this.firstName?.toLowerCase() || "";
    const last = this.lastName?.toLowerCase() || "";
    const phoneDigits = this.phoneNumber?.slice(0, 2) || "00";
    const baseName = `${first}${last}${phoneDigits}` || "user";

    let uniqueName = baseName;
    let existingUser = await userModel.findOne({ userName: uniqueName });
    while (existingUser) {
      uniqueName = `${baseName}${Math.floor(Math.random() * 10)}`;
      existingUser = await userModel.findOne({ userName: uniqueName });
    }

    this.userName = uniqueName;
  }

  if (!this.role) {
    const defaultRole = await customRoleModel.findOne({ name: "user" });
    if (defaultRole) {
      this.role = defaultRole._id;
      this.roleModel = "customRole";
    }
  }

  next();
});

export const userModel = model<IUser>("user", userSchema);
