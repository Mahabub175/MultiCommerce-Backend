import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { orderModel } from "./order.model";
import { IOrder } from "./order.interface";

// Create a new order
const createOrderService = async (orderData: IOrder) => {
  const result = await orderModel.create(orderData);
  return result;
};

// Get all orders (with optional pagination & search)
const getAllOrderService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = orderModel
      .find()
      .populate("user", "name email")
      .populate("items.product", "name price")
      .populate("coupon", "code amount type");

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    return result;
  } else {
    results = await orderModel
      .find()
      .populate("user", "name email")
      .populate("items.product", "name price")
      .populate("coupon", "code amount type")
      .sort({ createdAt: -1 })
      .exec();

    return { results };
  }
};

// Get single order
const getSingleOrderService = async (orderId: string | number) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await orderModel
    .findById(queryId)
    .populate("user", "name email")
    .populate("items.product", "name price")
    .populate("coupon", "code amount type")
    .exec();

  if (!result) {
    throw new Error("Order not found");
  }

  return result;
};

// Update single order
const updateSingleOrderService = async (
  orderId: string | number,
  orderData: Partial<IOrder>
) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await orderModel
    .findByIdAndUpdate(
      queryId,
      { $set: orderData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Order not found");
  }

  return result;
};

// Delete single order (hard delete)
const deleteSingleOrderService = async (orderId: string | number) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await orderModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Order not found");
  }

  return result;
};

// Delete multiple orders (hard delete)
const deleteManyOrderService = async (orderIds: (string | number)[]) => {
  const queryIds = orderIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await orderModel.deleteMany({ _id: { $in: queryIds } }).exec();

  return result;
};

export const orderServices = {
  createOrderService,
  getAllOrderService,
  getSingleOrderService,
  updateSingleOrderService,
  deleteSingleOrderService,
  deleteManyOrderService,
};
