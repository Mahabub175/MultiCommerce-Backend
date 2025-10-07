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
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
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

userSchema.pre("save", async function (next) {
  if (!this.userName) {
    let baseName =
      this.firstName?.toLowerCase() ||
      this.lastName?.toLowerCase() ||
      (this.email ? this.email.split("@")[0] : "user");

    let uniqueName = baseName;
    let counter = 1;

    const existingUser = await userModel.findOne({ userName: uniqueName });

    while (existingUser) {
      uniqueName = `${baseName}${Math.floor(Math.random() * 1000)}`;
      const check = await userModel.findOne({ userName: uniqueName });
      if (!check) break;
      counter++;
    }

    this.userName = uniqueName;
  }

  next();
});

export const userModel = model<IUser>("user", userSchema);
