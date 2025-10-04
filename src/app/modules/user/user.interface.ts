import { Types } from "mongoose";

export interface IPreviousPasswords {
  password: string;
  createdAt: Date;
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
  number: string;
  role: Types.ObjectId;
  otp: number | string;
  otpGeneratedAt: string;
  defaultPassword: string;
  point: number;
  city: string;
  city2: string;
  streetAddress1: string;
  streetAddress2: string;
  zipCode: string;
  zipCode2: string;
  previousPasswords: IPreviousPasswords[];
  status: boolean;
}
