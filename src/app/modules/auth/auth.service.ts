import jwt from "jsonwebtoken";
import config from "../../config";
import { compareHashPassword, hashPassword } from "../../utils/passwordUtils";
import { userModel } from "../user/user.model";
import { sendSMS } from "../../utils/sendSMS";
import { createToken } from "./auth.utils";
import httpStatus from "http-status";
import appError from "../../errors/appError";
import mongoose from "mongoose";
import { globalSettingModel } from "../globalSetting/globalSetting.model";

const sendUserOtpService = async (phoneNumber: string) => {
  const globalSetting = await globalSettingModel.findOne();

  if (!globalSetting || !globalSetting.useSms) {
    const fallbackOtp = "0000";
    return {
      otp: createToken(
        { otp: fallbackOtp },
        config.jwt_access_secret as string,
        "10m"
      ),
      message: "SMS is disabled. Use fallback OTP 0000 for testing.",
    };
  }

  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const message = `Your OTP is ${generatedOtp}`;

  try {
    await sendSMS(phoneNumber, message);

    return {
      otp: createToken(
        { otp: generatedOtp },
        config.jwt_access_secret as string,
        "10m"
      ),
    };
  } catch (error: any) {
    throw new Error(error.message || "Error sending OTP");
  }
};

const loginUserService = async (userData: any) => {
  const query = {
    $or: [
      { phoneNumber: userData.id },
      { email: userData.id },
      { userName: userData.id },
    ],
  };

  const user = await userModel
    .findOne(query)
    .populate("role")
    .select(
      "_id firstName lastName userName email phoneNumber password defaultPassword role roleModel status otp otpGeneratedAt"
    );

  if (!user) {
    throw new Error("User not found!");
  }

  if (!user.status) {
    throw new Error("Your account is inactive. Please contact support.");
  }

  if (userData.password) {
    const isPasswordCorrect = await compareHashPassword(
      userData.password,
      user.password
    );

    if (!isPasswordCorrect) {
      throw new Error(
        "Wrong password! Please try again with a valid password!"
      );
    }
  } else if (userData.defaultPassword) {
    const isUserCorrect = userData.defaultPassword === user.defaultPassword;

    if (!isUserCorrect) {
      throw new Error(
        "Wrong credentials! Please try again with valid credentials!"
      );
    }
  } else if (userData.otp) {
    const globalSetting = await globalSettingModel.findOne();

    if (!globalSetting || !globalSetting.useSms) {
      if (userData.otp !== "0000") {
        throw new Error("Invalid fallback OTP. Use 0000.");
      }
    } else {
      if (!user.otp || !user.otpGeneratedAt) {
        throw new Error("OTP not found. Please request a new OTP.");
      }

      const otpExpiryTime = new Date(user.otpGeneratedAt);
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 5);

      if (new Date() > otpExpiryTime) {
        throw new Error("OTP expired. Please request a new OTP.");
      }

      if (user.otp !== userData.otp) {
        throw new Error("Invalid OTP. Please try again.");
      }
      await userModel.findByIdAndUpdate(user._id, {
        $unset: { otp: 1, otpGeneratedAt: 1 },
      });
    }
  } else {
    throw new Error(
      "Either password, default password, or OTP is required for login."
    );
  }

  const expirationTime = Math.floor(Date.now() / 1000 + 7 * 24 * 60 * 60);

  const jwtPayload = {
    userId: user._id,
    phoneNumber: user.phoneNumber,
    roleModel: user.roleModel,
    role: (user.role as any).name,
    exp: expirationTime,
  };
  const token = jwt.sign(jwtPayload, config.jwt_access_secret as string);

  return {
    user: {
      _id: user._id,
      name: user.firstName + " " + user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: {
        _id: (user.role as any)._id,
        name: (user.role as any).name,
      },
    },
    token,
  };
};

const changeUserPasswordService = async (
  userId: string,
  userData: { currentPassword: string; newPassword: string }
) => {
  const user = await userModel
    .findById(userId)
    .select("password previousPasswords");

  if (!user) {
    throw new Error("User not found!");
  }

  const matchPassword = await compareHashPassword(
    userData.currentPassword,
    user.password
  );
  if (!matchPassword) {
    throw new Error("Incorrect current password! Please try again.");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const isSameAsCurrent = await compareHashPassword(
      userData.newPassword,
      user.password
    );
    if (isSameAsCurrent) {
      throw new Error(
        "New password must be different from the current password."
      );
    }

    const previousPasswords = user.previousPasswords || [];
    for (const previousPasswordObj of previousPasswords) {
      const isSameAsPrevious = await compareHashPassword(
        userData.newPassword,
        previousPasswordObj.password
      );
      if (isSameAsPrevious) {
        throw new Error(
          "New password must not match any of the last two used passwords."
        );
      }
    }

    const hashedPassword = await hashPassword(userData.newPassword);

    if (previousPasswords.length >= 2) {
      await userModel.findByIdAndUpdate(
        userId,
        {
          $pull: {
            previousPasswords: { password: previousPasswords[0].password },
          },
        },
        { session }
      );
    }
    await userModel.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        $push: {
          previousPasswords: {
            password: hashedPassword,
            createdAt: new Date(),
          },
        },
      },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    return await userModel.findById(userId);
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error("Failed to change password. " + error.message);
  }
};

const forgotUserPasswordService = async (userPhoneNumber: string) => {
  const query = { phoneNumber: userPhoneNumber };
  const user = await userModel.findOne(query);

  if (!user) {
    throw new appError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  if (!user.status) {
    throw new appError(
      httpStatus.FORBIDDEN,
      "This user is inactive! Please contact support."
    );
  }

  const globalSetting = await globalSettingModel.findOne();

  let generatedOtp: string;
  if (globalSetting && globalSetting.useSms) {
    generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    await userModel.findOneAndUpdate(
      { phoneNumber: userPhoneNumber },
      { otp: generatedOtp, otpGeneratedAt: new Date() }
    );

    const message = `Your OTP is ${generatedOtp}`;
    await sendSMS(userPhoneNumber, message);
  } else {
    generatedOtp = "0000";
  }

  return {
    otp: createToken(
      { otp: generatedOtp },
      config.jwt_access_secret as string,
      "10m"
    ),
  };
};

const resetUserPasswordService = async (payload: {
  phoneNumber: string;
  newPassword: string;
  otp: string;
}) => {
  const query = { phoneNumber: payload.phoneNumber };

  const user = await userModel.findOne(query);

  if (!user) {
    throw new appError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  if (!user.status) {
    throw new appError(
      httpStatus.FORBIDDEN,
      "This user is inactive! Please contact support."
    );
  }

  const globalSetting = await globalSettingModel.findOne();

  if (!globalSetting || !globalSetting.useSms) {
    if (payload.otp !== "0000") {
      throw new appError(httpStatus.FORBIDDEN, "Invalid fallback OTP!");
    }
  } else {
    if (user.otp !== payload.otp) {
      throw new appError(httpStatus.FORBIDDEN, "Invalid OTP!");
    }

    const otpExpirationTime = new Date(user.otpGeneratedAt);
    otpExpirationTime.setMinutes(otpExpirationTime.getMinutes() + 10);
    if (new Date() > otpExpirationTime) {
      throw new appError(httpStatus.FORBIDDEN, "OTP has expired!");
    }
  }

  const newHashedPassword = await hashPassword(payload.newPassword);

  await userModel.findOneAndUpdate(
    { phoneNumber: payload.phoneNumber },
    {
      password: newHashedPassword,
      $unset: { otp: 1, otpGeneratedAt: 1 },
      $push: {
        previousPasswords: {
          password: newHashedPassword,
          createdAt: new Date(),
        },
      },
    }
  );
};

export const authServices = {
  sendUserOtpService,
  loginUserService,
  changeUserPasswordService,
  forgotUserPasswordService,
  resetUserPasswordService,
};
