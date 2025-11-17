import { Types } from "mongoose";

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
  shippingMethod: string;
  shippingSlot: Types.ObjectId;
  selectedSlot: Types.ObjectId;
  selectedSlotDetails?: any;
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
