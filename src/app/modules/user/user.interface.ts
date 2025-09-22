import { Types } from "mongoose";

export interface IPreviousPasswords {
  password: string;
  createdAt: Date;
}

export interface IUser {
  userName: string;
  email: string;
  password: string;
  name: string;
  profileImage: string;
  address: string;
  credit: number;
  number: string;
  role: Types.ObjectId;
  otp: number | string;
  otpGeneratedAt: string;
  defaultPassword: string;
  point: number;
  previousPasswords: IPreviousPasswords[];
  status: boolean;
}
