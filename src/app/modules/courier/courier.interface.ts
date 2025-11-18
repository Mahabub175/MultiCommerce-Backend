import { Document } from "mongoose";

export interface IReturnRequest {
  orderId: string;
  reason: string;
}

export interface IReturnDecision {
  orderId: string;
  decision: "accepted" | "rejected";
}

export interface ICourier extends Document {
  courierName: string;
  attachment: string;
  status: boolean;
  shippingSlots: {
    _id?: string;
    slotName: string;
    startTime: string;
    endTime: string;
    basePrice: number;
    perKmPrice: number;
    additionalPricePerKm?: number;
    maxOrders?: number;
    estimatedDeliveryTime: number;
    status: boolean;
  }[];
}
