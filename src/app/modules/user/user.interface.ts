import { Types } from "mongoose";

export interface IPreviousPasswords {
  password: string;
  createdAt: Date;
}

export interface IUserAccess {
  path: string;
  permissions: string[];
}

export interface IShippingAddress {
  city: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  email: string;
  label: string;
  zipCode: string;
  streetAddress: string;
  addressSummary: string;
  isDefault: boolean;
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
  city1: string;
  city2: string;
  streetAddress1: string;
  streetAddress2: string;
  addressSummary1: string;
  addressSummary2: string;
  country1: string;
  country2: string;
  zipCode1: string;
  zipCode2: string;
  shippingAddresses: IShippingAddress[];
  previousPasswords: IPreviousPasswords[];
  access: IUserAccess[];
  status: boolean;
}
