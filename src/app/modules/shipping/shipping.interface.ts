import { Document, Types } from "mongoose";

export interface IShippingSlot extends Document {
  slotName: string;
  startTime: string;
  courierName: string;
  attachment: string;
  endTime: string;
  basePrice: number;
  perKmPrice: number;
  additionalPricePerKm?: number;
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
  progress?: {
    status:
      | "pending"
      | "dispatched"
      | "in_transit"
      | "delivered"
      | "cancelled"
      | "returned";
    note?: string;
    updatedAt?: Date;
  }[];
  notes?: string;
  active?: boolean;
}

export interface IShippingOrder extends Document {
  shippingSlot: Types.ObjectId;
  courier?: {
    name?: string;
    contact?: string;
    trackingId?: string;
  };
  deliveryList: IDeliveryItem[];
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
