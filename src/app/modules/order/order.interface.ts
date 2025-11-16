import { Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  variant?: string;
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
  method: "paypal" | "stripe" | "cash_on_delivery" | "manual" | "points";
  transactionId?: string;
  status?: "pending" | "completed" | "failed";
}

export interface IOrder {
  orderId: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentInfo: IPaymentInfo;
  subtotal: number;
  additionalPayment: number;
  discount?: number;
  grandTotal: number;
  coupon?: Types.ObjectId;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  note?: string;
  status: boolean;
}
