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
    basePrice: number; // Default base price (used if no area matches)
    perKmPrice: number;
    additionalPricePerKm?: number;
    maxOrders?: number;
    estimatedDeliveryTime: number;
    status: boolean;
    // New fields for dynamic pricing
    weightMultiplier?: number; // Cost per kg (or per 100g if specified)
    weightUnit?: "kg" | "100g"; // Unit for weight calculation
    dimensionMultiplier?: number; // Cost per cubic cm or per 1000 cubic cm
    dimensionUnit?: "cm3" | "1000cm3"; // Unit for dimension calculation
    useDimensionalWeight?: boolean; // Use dimensional weight (LxWxH/5000) if true
    dimensionalWeightDivisor?: number; // Divisor for dimensional weight (default: 5000)
  }[];
}
