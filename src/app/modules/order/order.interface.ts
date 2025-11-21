import { Types } from "mongoose";

export interface IUpdateOrderItemStatus {
  itemId: string;
  status:
    | "pending"
    | "dispatched"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "returned";
}

export interface IReturnRequest {
  quantity: number;
  itemId: string;
  note: string;
  shippingAddress: IShippingAddress;
  freeShippingLabel: boolean;
  trackingNumber: string;
  status: "none" | "pending" | "accepted" | "rejected";
  reason: string;
}

export interface IReturnDecision {
  itemId: string;
  decision: "accepted" | "rejected";
  trackingNumber: string;
  freeShippingLabel: boolean;
}
export interface IDeliveryProgress {
  status: string;
  note?: string;
  updatedAt: Date;
}

export interface IReturnDetails {
  quantity: number;
  itemId: string;
  note: string;
  shippingAddress: IShippingAddress;
  freeShippingLabel: boolean;
  trackingNumber: string;
  status: "none" | "pending" | "accepted" | "rejected";
  reason: string;
  requestedAt: Date;
}

export interface IOrderItem {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  sku: string;
  quantity: number;
  weight?: number;
  price: number;
  variant?: string;
  charge?: number;
  status:
    | "pending"
    | "dispatched"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "returned";
  returnDetails: IReturnDetails;
  progress: IDeliveryProgress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IShippingAddress {
  city: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  email: string;
  label: string;
  zipCode: string;
  streetAddress: string;
  addressSummary: string;
}

export interface IPaymentInfo {
  method: "paypal" | "stripe" | "cash_on_delivery" | "manual" | "credit";
  transactionId?: string;
  status?: "pending" | "completed" | "failed";
}

export interface IOrder {
  orderId: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingMethod: string;
  courier?: Types.ObjectId;
  selectedSlot?: Types.ObjectId;
  shippingAddress: IShippingAddress;
  paymentInfo: IPaymentInfo;
  subtotal: number;
  additionalPayment?: number;
  discount?: number;
  creditAmount?: number;
  taxAmount?: number;
  deliveryCharge?: number;
  grandTotal: number;
  coupon?: Types.ObjectId;
  orderStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";

  note?: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}
