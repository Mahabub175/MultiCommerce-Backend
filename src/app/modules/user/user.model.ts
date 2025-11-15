import { Schema, model } from "mongoose";
import { IShippingAddress, IUser } from "./user.interface";
import { customRoleModel } from "../customRole/customRole.model";

const previousPasswordSchema = new Schema({
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phoneNumber: { type: String, trim: true },
  country: { type: String, trim: true },
  city: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  streetAddress: { type: String, trim: true },
  addressSummary: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    profileImage: String,
    credit: {
      type: Number,
      min: 0,
      set: (v: number) => parseInt(v.toString(), 10),
    },
    limit: Number,
    minimumAmount: Number,
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
    city1: String,
    zipCode1: String,
    streetAddress1: String,
    streetAddress2: String,
    addressSummary1: String,
    addressSummary2: String,
    country1: String,
    country2: String,
    city2: String,
    zipCode2: String,
    shippingAddresses: {
      type: [shippingAddressSchema],
      default: [],
    },
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
  const user = this as any;

  if (!user.userName) {
    const first = user.firstName?.toLowerCase() || "";
    const last = user.lastName?.toLowerCase() || "";
    const phoneDigits = user.phoneNumber?.slice(0, 2) || "00";
    const baseName = `${first}${last}${phoneDigits}` || "user";

    let uniqueName = baseName;
    let existingUser = await userModel.findOne({ userName: uniqueName });
    while (existingUser) {
      uniqueName = `${baseName}${Math.floor(Math.random() * 10)}`;
      existingUser = await userModel.findOne({ userName: uniqueName });
    }

    user.userName = uniqueName;
  }

  if (!user.role) {
    const defaultRole = await customRoleModel.findOne({ name: "user" });
    if (defaultRole) {
      user.role = defaultRole._id;
      user.roleModel = "customRole";
    }
  }
  if (
    (!user.shippingAddresses || user.shippingAddresses.length === 0) &&
    (user.city1 || user.streetAddress1)
  ) {
    const defaultAddress = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      country: user.country1 || "",
      city: user.city1 || "",
      zipCode: user.zipCode1 || "",
      streetAddress: user.streetAddress1 || "",
      addressSummery: user.addressSummery1 || "",
      isDefault: true,
    };

    user.shippingAddresses = [defaultAddress];
  }

  next();
});

export const userModel = model<IUser>("user", userSchema);
