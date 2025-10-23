import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";
import { roleModel } from "../role/role.model";

const previousPasswordSchema = new Schema({
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new Schema<IUser>(
  {
    userName: {
      type: String,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      trim: true,
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      required: true,
    },
    profileImage: {
      type: String,
    },
    address: {
      type: String,
    },
    credit: {
      type: Number,
      min: 0,
      set: (val: number) => parseInt(val.toString(), 10),
    },
    point: {
      type: Number,
      set: (val: number) => parseInt(val.toString(), 10),
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "role",
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    streetAddress1: {
      type: String,
    },
    streetAddress2: {
      type: String,
    },
    city2: {
      type: String,
    },
    zipCode2: {
      type: String,
    },
    otp: {
      type: String,
      required: false,
      trim: true,
      default: "0000",
    },
    otpGeneratedAt: {
      type: String,
      required: false,
      trim: true,
    },
    defaultPassword: {
      type: String,
      trim: true,
      default: function () {
        return this.phoneNumber;
      },
    },
    previousPasswords: [previousPasswordSchema],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.userName) {
    const first = this.firstName ? this.firstName.toLowerCase() : "";
    const last = this.lastName ? this.lastName.toLowerCase() : "";
    const phoneDigits = this.phoneNumber ? this.phoneNumber.slice(0, 2) : "00";

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
    const defaultRole = await roleModel.findOne({ name: "user" });
    if (defaultRole) {
      this.role = defaultRole._id;
    }
  }

  next();
});

export const userModel = model<IUser>("user", userSchema);
