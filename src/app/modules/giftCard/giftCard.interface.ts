import { Types, Document } from "mongoose";

export interface IGiftCard extends Document {
  name: string;
  code: string;
  user?: Types.ObjectId[];
  count: number;
  description: string;
  maxUsageCount: number;
  amount: number;
  expiredDate: Date;
  attachment?: string;
  status: boolean;
  isExpired(): boolean;
  isMaxUsed(): boolean;
  isValidForUser(userId: string): { valid: boolean; reason?: string };
  incrementUsage(): Promise<void>;
}
