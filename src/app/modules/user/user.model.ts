import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";

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
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      trim: true,
      default: "User",
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
    number: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "role",
      required: true,
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
        return this.number;
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

export const userModel = model<IUser>("user", userSchema);
