import { Types } from "mongoose";

export interface IPreviousPasswords {
  password: string;
  createdAt: Date;
}

export interface IShippingAddress {
  city: { type: string };
  zipCode: { type: string };
  streetAddress1: { type: string };
  isDefault: { type: boolean; default: false };
}

export interface IUser {
  userName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  address: string;
  credit: number;
  limit: number;
  minimumAmount: number;
  phoneNumber: string;
  role: Types.ObjectId;
  roleModel: string;
  otp: number | string;
  otpGeneratedAt: string;
  defaultPassword: string;
  point: number;
  city: string;
  city2: string;
  streetAddress1: string;
  streetAddress2: string;
  addressSummery: string;
  zipCode: string;
  zipCode2: string;
  shippingAddresses: IShippingAddress[];
  previousPasswords: IPreviousPasswords[];
  status: boolean;
}
