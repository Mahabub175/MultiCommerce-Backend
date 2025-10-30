import { Document, Types } from "mongoose";

export interface IShippingSlot extends Document {
  slotName: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  perKmPrice: number;
  additionalPricePerKm?: number;
  maxOrders?: number;
  estimatedDeliveryTime: number;
  status: boolean;
}

export interface IShippingOrder extends Document {
  order: Types.ObjectId[];
  user: Types.ObjectId[];
  shippingSlot: Types.ObjectId;
  deliveryAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    location?: { lat: number; lng: number };
  };
  deliveryCharge: number;
  expectedDeliveryAt?: Date;
  actualDeliveryAt?: Date;
  courier?: {
    name?: string;
    contact?: string;
    trackingId?: string;
  };
  shippingStatus:
    | "pending"
    | "dispatched"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "returned";
  notes?: string;
  status: boolean;
}
