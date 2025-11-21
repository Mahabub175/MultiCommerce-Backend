import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { orderModel } from "./order.model";
import {
  IOrder,
  IOrderItem,
  IReturnDecision,
  IReturnDetails,
  IReturnRequest,
  IUpdateOrderItemStatus,
} from "./order.interface";
import { couponModel } from "../coupon/coupon.model";
import { courierModel } from "../courier/courier.model";
import { productModel } from "../product/product.model";
import { userModel } from "../user/user.model";

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
  const { user, items, shippingMethod, coupon, orderId, creditAmount } =
    payload;

  const userDoc = await userModel.findById(user);
  if (!userDoc) throw new Error("User not found");

  if (creditAmount && creditAmount > 0) {
    if ((userDoc.credit || 0) < creditAmount) {
      throw new Error("User does not have enough credit!");
    }

    if ((userDoc.limit || 0) > creditAmount) {
      throw new Error(
        `Credit amount must be at least ${userDoc.limit} to be applied!`
      );
    }

    userDoc.credit -= creditAmount;
    await userDoc.save();
  }

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
      orderId,
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
  currentUser: any,
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  const isCustomRole = currentUser?.roleModel === "customRole";

  const filter: any = {};

  if (isCustomRole) {
    filter.user = currentUser.userId;
  }

  let query = orderModel
    .find(filter)
    .populate("user")
    .populate("courier")
    .populate("items.product", "name slug price")
    .populate("coupon", "code amount type");

  if (page || limit || searchText) {
    return await paginateAndSort(query, page, limit, searchText, searchFields);
  }

  const results = await query.sort({ createdAt: -1 });
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

  const updatedItems: {
    itemId: string;
    oldStatus: string;
    newStatus: string;
  }[] = [];

  updates.forEach(({ itemId, status }) => {
    const item = order.items.find((i) => i.product.toString() === itemId);
    if (!item) throw new Error(`Item not found: ${itemId}`);

    const oldStatus = item.status;
    item.status = status;
    item.progress.push({
      status,
      note: `Status updated from '${oldStatus}' to '${status}'`,
      updatedAt: new Date(),
    });

    updatedItems.push({ itemId, oldStatus, newStatus: status });
  });

  await order.save();

  return updatedItems;
};

// Submit return requests for delivered items
const requestReturnService = async (
  orderId: string,
  returnRequests: IReturnRequest[]
) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const updatedItems: string[] = [];

  for (const req of returnRequests) {
    const { itemId, quantity, reason, note, shippingAddress, shippingMethod } =
      req;

    const item = order.items.find((i) => i.product.toString() === itemId);
    if (!item) throw new Error(`Item not found: ${itemId}`);

    if (item.status === "returned") {
      throw new Error(`Item already returned: ${itemId}`);
    }
    if (item.status !== "delivered") {
      throw new Error(`Only delivered items can be returned: ${itemId}`);
    }

    if (item.returnDetails?.status !== "none") {
      throw new Error(`Return request already submitted: ${itemId}`);
    }

    item.returnDetails = {
      quantity,
      itemId,
      reason,
      note: note || "",
      shippingAddress,
      shippingMethod,
      freeShippingLabel: false,
      trackingNumber: "",
      status: "pending",
      requestedAt: new Date(),
    } as IReturnDetails;

    item.progress.push({
      status: "return_requested",
      note: reason,
      updatedAt: new Date(),
    });

    updatedItems.push(itemId);
  }

  await order.save();
  return {
    message: "Return request submitted successfully",
    updatedItems,
  };
};

// Handle admin return decisions
const handleReturnRequestService = async (
  orderId: string,
  returnDecisions: IReturnDecision[]
) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");
  const updatedItems: string[] = [];

  for (const req of returnDecisions) {
    const { itemId, decision, trackingNumber, freeShippingLabel } = req;

    const item = order.items.find((i) => i.product.toString() === itemId);
    if (!item) throw new Error(`Item not found: ${itemId}`);

    if (item.status === "returned") {
      throw new Error(`Item already returned: ${itemId}`);
    }

    if (!item.returnDetails || item.returnDetails.status !== "pending") {
      throw new Error(`No active return request: ${itemId}`);
    }

    item.returnDetails.status = decision;
    if (trackingNumber) item.returnDetails.trackingNumber = trackingNumber;
    if (freeShippingLabel !== undefined)
      item.returnDetails.freeShippingLabel = freeShippingLabel;

    if (decision === "accepted") {
      item.status = "returned";
    }

    item.progress.push({
      status: `return_${decision}`,
      note: `Admin ${decision} the return request`,
      updatedAt: new Date(),
    });

    updatedItems.push(itemId);
  }

  await order.save();

  return {
    message: "Return request decisions processed",
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

const getOrdersByUserService = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const orders = await orderModel
    .find({ user: userId })
    .populate("user", "firstName lastName email phoneNumber")
    .populate("coupon")
    .populate("courier")
    .sort({ createdAt: -1 });

  return orders;
};

const getReturnedProductsService = async (currentUser: any) => {
  const isCustom = currentUser?.roleModel === "customRole";

  const baseFilter: any = {
    "items.returnDetails.status": { $ne: "none" },
  };

  if (isCustom) {
    baseFilter.user = currentUser.userId;
  }

  const orders = await orderModel
    .find(baseFilter)
    .populate("user", "firstName lastName email phoneNumber")
    .populate("courier")
    .populate("items.product", "name slug price")
    .populate("coupon", "code amount type")
    .sort({ createdAt: -1 })
    .lean();

  const returnedItems: any[] = [];

  for (const order of orders) {
    const matched = order.items.filter(
      (item: any) =>
        item.returnDetails?.status && item.returnDetails.status !== "none"
    );
    matched.forEach((item: any) => {
      returnedItems.push({
        _id: item._id,
        orderId: order.orderId,
        orderDate: order.createdAt,
        user: order.user,
        product: {
          _id: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          sku: item.sku,
        },
        orderQuantity: item.quantity,
        price: item.price,
        shippingMethod: item.shippingMethod,
        returnDetails: {
          returnStatus: item.returnDetails?.status,
          returnQuantity: item.returnDetails?.quantity || item.quantity,
          returnReason: item.returnDetails?.reason || "",
          returnNote: item.returnDetails?.note || "",
          status: item.status,
        },
        progress: item.progress,
      });
    });
  }

  return returnedItems;
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
  getOrdersByUserService,
  getReturnedProductsService,
};
