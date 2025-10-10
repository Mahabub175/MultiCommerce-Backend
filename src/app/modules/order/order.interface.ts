import { Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  variant?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
}

export interface IPaymentInfo {
  method: "paypal" | "stripe" | "cash_on_delivery" | "manual" | "points";
  transactionId?: string;
  status?: "pending" | "completed" | "failed";
}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentInfo: IPaymentInfo;
  subtotal: number;
  discount?: number;
  grandTotal: number;
  coupon?: Types.ObjectId;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  note?: string;
  status: boolean;
}
