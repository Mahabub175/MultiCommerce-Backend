import { Document, Types } from "mongoose";

export interface IReturnRequest {
  orderId: string;
  reason: string;
}

export interface IReturnDecision {
  orderId: string;
  decision: "accepted" | "rejected";
}

export interface IShippingSlot extends Document {
  slotName: string;
  startTime: string;
  courierName: string;
  attachment: string;
  endTime: string;
  basePrice: number;
  perKmPrice: number;
  additionalPricePerKm?: number;
  attachment:string;
  maxOrders?: number;
  estimatedDeliveryTime: number;
  status: boolean;
}

export interface IDeliveryItem {
  order: Types.ObjectId;
  charge: number;
  expectedDeliveryAt?: Date;
  actualDeliveryAt?: Date;
  status:
    | "pending"
    | "dispatched"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "returned";
  returnRequested: boolean;
  returnStatus: "none" | "pending" | "accepted" | "rejected";
  returnReason: string;
  returnNote: string;
  progress: {
    status: string;
    note: string;
    updatedAt?: Date;
  }[];
}

export interface IShippingOrder extends Document {
  shippingSlot: Types.ObjectId;
  courier?: {
    name?: string;
    contact?: string;
    trackingId?: string;
  };
  deliveryList: IDeliveryItem[];
  note: string;
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
