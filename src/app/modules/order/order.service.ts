import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { orderModel } from "./order.model";
import { IOrder } from "./order.interface";

// Create a new order
const createOrderService = async (payload: IOrder) => {
  const { user, items, shippingMethod } = payload;
  
  if (shippingMethod === "add_to_my_existing_order") {
    const existingOrder = await orderModel.findOne({
      user,
      orderStatus: { $in: ["pending", "processing"] },
    }).sort({ createdAt: -1 });

    if (!existingOrder) {
      throw new Error("No existing order found to add items to.");
    }
    for (const newItem of items) {
      const existingItem = existingOrder.items.find(
        (i) =>
          i.product.toString() === newItem.product.toString() &&
          i.variant === newItem.variant
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        existingOrder.items.push(newItem);
      }
    }
    existingOrder.subtotal = existingOrder.items.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    existingOrder.grandTotal =
      existingOrder.subtotal +
      (existingOrder.additionalPayment || 0) -
      (existingOrder.discount || 0) -
      (existingOrder.creditAmount || 0);

    await existingOrder.save();

    return existingOrder;
  }
  
  const newOrder = await orderModel.create(payload);
  return newOrder;
};

// Get all orders (with optional pagination & search)
const getAllOrderService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page || limit || searchText) {
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
