import { Document, ObjectId } from "mongoose";

export interface ICoupon extends Document {
  name: string;
  code: string;
  description?: string;
  type: "fixed" | "percentage";
  amount: number;
  maxAmount?: number;
  minimumAmount: number;
  expiredDate: Date;
  count: number;
  maxUsageCount: number;
  attachment?: string;
  user?: ObjectId[];
  status: boolean;

  isExpired(): boolean;
  isMaxUsed(): boolean;
  isValidForUser(
    userId: string,
    orderAmount: number
  ): { valid: boolean; reason?: string };
  calculateDiscount(orderAmount: number): number;
  incrementUsage(): Promise<void>;
}
