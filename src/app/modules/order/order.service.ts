import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { orderModel } from "./order.model";
import {
  IOrder,
  IOrderItem,
  IReturnDecision,
  IReturnRequest,
  IUpdateOrderItemStatus,
} from "./order.interface";
import { couponModel } from "../coupon/coupon.model";
import { courierModel } from "../courier/courier.model";
import { productModel } from "../product/product.model";

const calculateTotals = (order: any) => {
  order.subtotal = order.items.reduce(
    (sum: number, it: IOrderItem) => sum + it.price * it.quantity,
    0
  );

  order.grandTotal =
    order.subtotal +
    (order.taxAmount || 0) +
    (order.additionalPayment || 0) -
    (order.discount || 0) -
    (order.creditAmount || 0);

  return order;
};

const createOrderService = async (payload: IOrder) => {
  const { user, items, shippingMethod, coupon, orderId } = payload;

  if (coupon) {
    const couponDoc = await couponModel.findById(coupon);
    if (!couponDoc) {
      throw new Error("Invalid coupon ID.");
    }

    couponDoc.count = (couponDoc.count || 0) + 1;
    await couponDoc.save();
  }

  if (shippingMethod === "add_to_my_existing_order") {
    if (!orderId) {
      throw new Error("orderId is required to add items to an existing order");
    }

    const existingOrder = await orderModel.findOne({
      _id: orderId,
      user,
    });

    if (!existingOrder) {
      throw new Error("No existing order found with this orderId");
    }

    for (const newItem of items) {
      const existingItem = existingOrder.items.find(
        (i: any) =>
          i.product.toString() === newItem.product.toString() &&
          i.sku === newItem.sku
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        existingOrder.items.push(newItem);
      }
    }

    calculateTotals(existingOrder);
    await existingOrder.save();

    return existingOrder;
  }

  if (shippingMethod === "reserve_order") {
    for (const item of items) {
      const product = await productModel.findById(item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v) => v.sku === item.variant);
        if (!variant) throw new Error(`Variant not found: ${item.variant}`);

        variant.stock -= item.quantity;

        product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      } else {
        product.stock -= item.quantity;
      }

      await product.save();
    }
  }

  const newOrder = await orderModel.create(payload);
  return newOrder;
};

const getAllOrderService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  if (page || limit || searchText) {
    const query = orderModel
      .find()
      .populate("user")
      .populate("courier")
      .populate("items.product", "name slug price")
      .populate("coupon", "code amount type");

    return await paginateAndSort(query, page, limit, searchText, searchFields);
  }

  const results = await orderModel
    .find()
    .populate("user")
    .populate("courier")
    .populate("items.product", "name slug price")
    .populate("coupon", "code amount type")
    .sort({ createdAt: -1 });

  return { results };
};

const getSingleOrderService = async (orderId: string | number) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await orderModel
    .findById(queryId)
    .populate("user")
    .populate("courier")
    .populate("items.product", "name slug price")
    .populate("coupon", "code amount type");

  if (!result) {
    throw new Error("Order not found");
  }

  return result;
};

const updateSingleOrderService = async (
  orderId: string | number,
  orderData: Partial<IOrder>
) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await orderModel.findByIdAndUpdate(
    queryId,
    { $set: orderData },
    { new: true, runValidators: true }
  );

  if (!result) {
    throw new Error("Order not found");
  }

  return result;
};

const deleteSingleOrderService = async (orderId: string | number) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await orderModel.findByIdAndDelete(queryId);

  if (!result) {
    throw new Error("Order not found");
  }

  return result;
};

const deleteManyOrderService = async (orderIds: (string | number)[]) => {
  const queryIds = orderIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    }
    throw new Error(`Invalid ID format: ${id}`);
  });

  return await orderModel.deleteMany({ _id: { $in: queryIds } });
};

// Assign shipping slot to order
const assignShippingSlotService = async (orderId: string, slotId: string) => {
  const slot = await courierModel.findById(slotId);
  if (!slot) throw new Error("Invalid shipping slot");

  const order = await orderModel.findByIdAndUpdate(
    orderId,
    { courier: slot._id },
    { new: true }
  );

  if (!order) throw new Error("Order not found");
  return order;
};

// Update shipping status of an order item
const updateShippingStatusService = async (
  orderId: string,
  updates: IUpdateOrderItemStatus[]
) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const updatedItems: string[] = [];

  for (const { itemId, status } of updates) {
    const item = order.items.find((i) => i._id.toString() === itemId);
    if (!item) continue;

    item.status = status;
    item.progress.push({
      status,
      note: `Status updated to ${status}`,
      updatedAt: new Date(),
    });

    updatedItems.push(itemId);
  }

  await order.save();
};

// Submit return requests for delivered items
const requestReturnService = async (
  orderId: string,
  returnRequests: IReturnRequest[]
) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const updatedItems: string[] = [];
  for (const { itemId, reason } of returnRequests) {
    const item = order.items.find((i) => i._id.toString() === itemId);

    if (!item) throw new Error(`Item not found: ${itemId}`);
    if (item.status !== "delivered")
      throw new Error(`Only delivered items can be returned: ${itemId}`);
    if (item.returnRequested)
      throw new Error(`Return request already submitted: ${itemId}`);

    item.returnRequested = true;
    item.returnStatus = "pending";
    item.returnReason = reason;
    item.progress.push({
      status: "return_requested",
      note: reason,
      updatedAt: new Date(),
    });

    updatedItems.push(itemId.toString());
  }

  await order.save();
  return { message: "Return requests submitted", updatedItems };
};

// Handle admin return decisions
const handleReturnRequestService = async (
  orderId: string,
  returnDecisions: IReturnDecision[]
) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const updatedItems: string[] = [];

  for (const { itemId, decision } of returnDecisions) {
    const item = order.items.find((i) => i._id.toString() === itemId);
    if (!item) throw new Error(`Item not found: ${itemId}`);
    if (!item.returnRequested || item.returnStatus !== "pending")
      throw new Error(`No active return request for item: ${itemId}`);

    item.returnStatus = decision;
    if (decision === "accepted") item.status = "returned";

    item.progress.push({
      status: `return_${decision}`,
      note: `Admin ${decision} the return request`,
      updatedAt: new Date(),
    });

    updatedItems.push(itemId.toString());
  }

  await order.save();
  return {
    message: `Return requests processed for ${updatedItems.length} item(s)`,
    updatedItems,
  };
};

// Get all orders by shipping slot
const getOrdersByShippingSlotService = async (slotId: string) => {
  const orders = await orderModel
    .find({ courier: new mongoose.Types.ObjectId(slotId) })
    .populate("user", "name email")
    .populate("items.product", "name price")
    .exec();

  return orders;
};

const addItemToOrderService = async (orderId: string, newItem: IOrderItem) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const existingItem = order.items.find(
    (i) =>
      i.product.toString() === newItem.product.toString() &&
      i.sku === newItem.sku
  );

  if (existingItem) {
    existingItem.quantity += newItem.quantity;
  } else {
    order.items.push(newItem);
  }

  order.subtotal = order.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  order.grandTotal =
    order.subtotal +
    (order.taxAmount || 0) +
    (order.additionalPayment || 0) -
    (order.discount || 0) -
    (order.creditAmount || 0);

  await order.save();
  return order;
};

// Update an item in an existing order
const updateOrderItemService = async (
  orderId: string,
  itemId: string,
  updatedData: Partial<IOrderItem>
) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.find((i) => i._id.toString() === itemId);
  if (!item) throw new Error("Item not found");

  Object.assign(item, updatedData);

  order.subtotal = order.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  order.grandTotal =
    order.subtotal +
    (order.taxAmount || 0) +
    (order.additionalPayment || 0) -
    (order.discount || 0) -
    (order.creditAmount || 0);

  await order.save();
  return order;
};

// Delete an item from an existing order
const deleteOrderItemService = async (orderId: string, itemId: string) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const itemIndex = order.items.findIndex((i) => i._id.toString() === itemId);
  if (itemIndex === -1) throw new Error("Item not found");

  order.items.splice(itemIndex, 1);

  order.subtotal = order.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  order.grandTotal =
    order.subtotal +
    (order.taxAmount || 0) +
    (order.additionalPayment || 0) -
    (order.discount || 0) -
    (order.creditAmount || 0);

  await order.save();

  const updatedOrder = await orderModel
    .findById(orderId)
    .populate("user", "name email")
    .populate("items.product", "name price")
    .populate("coupon", "code amount type")
    .exec();

  return updatedOrder;
};

export const orderServices = {
  createOrderService,
  getAllOrderService,
  getSingleOrderService,
  updateSingleOrderService,
  deleteSingleOrderService,
  deleteManyOrderService,
  assignShippingSlotService,
  updateShippingStatusService,
  requestReturnService,
  handleReturnRequestService,
  getOrdersByShippingSlotService,
  addItemToOrderService,
  updateOrderItemService,
  deleteOrderItemService,
};
