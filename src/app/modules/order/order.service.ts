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
  IDeliveryProgress,
} from "./order.interface";
import { couponModel } from "../coupon/coupon.model";
import { courierModel } from "../courier/courier.model";
import { productModel } from "../product/product.model";
import { userModel } from "../user/user.model";
import path from "path";
import fs from "fs";
import config from "../../config";
import { invoiceTemplate } from "../../utils/invoiceTemplate";
import htmlPdf from "html-pdf-node";

// --- Helper Functions ---

/**
 * Calculates subtotal, grandTotal, etc. for an order.
 * Mutates the order object or returns a new one if needed (here we mutate for mongoose docs).
 */
const calculateTotals = <T extends Partial<IOrder>>(order: T): T => {
  if (order.items) {
    order.subtotal = order.items.reduce(
      (sum: number, it: IOrderItem) => sum + it.price * it.quantity,
      0
    );
  }

  order.grandTotal =
    (order.subtotal || 0) +
    (order.taxAmount || 0) +
    (order.additionalPayment || 0) -
    (order.discount || 0) -
    (order.creditAmount || 0);

  return order;
};

/**
 * Syncs item statuses and payment status based on the main Order Status.
 * Handles:
 * - auto-delivery of items/payment when Order is delivered
 * - auto-cancellation of items when Order is cancelled
 * - reverting statuses if Order is moved back from delivered/cancelled
 */
const syncOrderStatus = async (orderDoc: any) => {
  let hasChanges = false;
  const status = orderDoc.orderStatus;

  // 1. Handle "Delivered"
  if (status === "delivered") {
    // Payment -> Completed
    if (orderDoc.paymentInfo && orderDoc.paymentInfo.status !== "completed") {
      orderDoc.paymentInfo.status = "completed";
      hasChanges = true;
    }

    // Items -> Delivered
    if (orderDoc.items && orderDoc.items.length > 0) {
      orderDoc.items.forEach((item: IOrderItem) => {
        if (
          item.status !== "delivered" &&
          item.status !== "cancelled" &&
          item.status !== "returned"
        ) {
          item.status = "delivered";
          item.progress.push({
            status: "delivered",
            note: "Auto-updated from Order Status",
            updatedAt: new Date(),
          });
          hasChanges = true;
        }
      });
    }
  }

  // 2. Handle "Cancelled"
  else if (status === "cancelled") {
    // Payment -> Failed (if strictly pending)
    if (orderDoc.paymentInfo && orderDoc.paymentInfo.status === "pending") {
      orderDoc.paymentInfo.status = "failed";
      hasChanges = true;
    }

    // Items -> Cancelled
    if (orderDoc.items && orderDoc.items.length > 0) {
      orderDoc.items.forEach((item: IOrderItem) => {
        if (item.status !== "cancelled" && item.status !== "returned") {
          item.status = "cancelled";
          item.progress.push({
            status: "cancelled",
            note: "Auto-cancelled from Order Status",
            updatedAt: new Date(),
          });
          hasChanges = true;
        }
      });
    }
  }

  // 3. Handle Active States (Processing, Shipped, Pending) - Revert/Sync
  else if (["shipped", "processing", "pending"].includes(status)) {
    // Revert Payment
    if (orderDoc.paymentInfo) {
      // If payment was auto-completed (for COD/Manual) -> Revert to pending
      if (
        (orderDoc.paymentInfo.method === "cash_on_delivery" || orderDoc.paymentInfo.method === "manual") &&
        orderDoc.paymentInfo.status === "completed"
      ) {
        orderDoc.paymentInfo.status = "pending";
        hasChanges = true;
      }

      // If payment was failed (from Cancelled) -> Revert to pending so it can be retried/processed
      if (orderDoc.paymentInfo.status === "failed") {
        orderDoc.paymentInfo.status = "pending";
        hasChanges = true;
      }
    }

    // Determine target item status
    let targetItemStatus = "pending";
    if (status === "shipped") targetItemStatus = "in_transit";
    else if (status === "processing") targetItemStatus = "pending"; // or dispatched?

    if (orderDoc.items && orderDoc.items.length > 0) {
      orderDoc.items.forEach((item: IOrderItem) => {
        // We only revert if it was previously delivered/cancelled or needs sync.
        // Don't un-return items.
        if (
          item.status !== "returned" &&
          item.status !== targetItemStatus
        ) {
          item.status = targetItemStatus as any;
          item.progress.push({
            status: targetItemStatus,
            note: `Auto-reverted from Order Status '${status}'`,
            updatedAt: new Date()
          });
          hasChanges = true;
        }
      });
    }
  }

  if (hasChanges) {
    await orderDoc.save();
  }
  return orderDoc;
};

// --- Services ---

const createOrderService = async (payload: IOrder) => {
  const { user, items, shippingMethod, coupon, orderId, creditAmount } = payload;

  const userDoc = await userModel.findById(user);
  if (!userDoc) throw new Error("User not found");

  // Validate Credit
  if (creditAmount && creditAmount > 0) {
    if ((userDoc.credit || 0) < creditAmount) throw new Error("User does not have enough credit!");
    if ((userDoc.limit || 0) > creditAmount) throw new Error(`Credit amount must be at least ${userDoc.limit} to be applied!`);
    userDoc.credit! -= creditAmount;
    await userDoc.save();
  }

  // Validate Coupon
  if (coupon) {
    const couponDoc = await couponModel.findById(coupon);
    if (!couponDoc) throw new Error("Invalid coupon ID.");
    couponDoc.count = (couponDoc.count || 0) + 1;
    await couponDoc.save();
  }

  // Handle "Existing Order" Shipping
  if (shippingMethod === "add_to_my_existing_order") {
    if (!orderId) throw new Error("orderId is required to add items to an existing order");

    const existingOrder = await orderModel.findOne({ orderId, user });
    if (!existingOrder) throw new Error("No existing order found with this orderId");

    for (const newItem of items) {
      const existingItem = existingOrder.items.find(
        (i: any) => i.product.toString() === newItem.product.toString() && i.sku === newItem.sku
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

  // Handle "Reserve Order" Stock Updates
  if (shippingMethod === "reserve_order") {
    for (const item of items) {
      const product = await productModel.findById(item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      if (product.variants?.length) {
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

  return await orderModel.create(payload);
};

const getAllOrderService = async (currentUser: any, page?: number, limit?: number, searchText?: string, searchFields?: string[]) => {
  const filter: any = {};
  if (currentUser?.roleModel === "customRole") {
    filter.user = currentUser.userId;
  }

  const query = orderModel.find(filter)
    .populate("user")
    .populate("courier")
    .populate("items.product")
    .populate("coupon");

  if (page || limit || searchText) {
    return await paginateAndSort(query, page, limit, searchText, searchFields);
  }
  const results = await query.sort({ createdAt: -1 });
  return { results };
};

const getSingleOrderService = async (orderId: string | number) => {
  const queryId = typeof orderId === "string" ? new mongoose.Types.ObjectId(orderId) : orderId;
  const result = await orderModel.findById(queryId)
    .populate("user")
    .populate("courier")
    .populate("items.product")
    .populate("coupon");

  if (!result) throw new Error("Order not found");
  return result;
};

const updateSingleOrderService = async (orderId: string | number, orderData: Partial<IOrder>) => {
  const queryId = typeof orderId === "string" ? new mongoose.Types.ObjectId(orderId) : orderId;

  const result = await orderModel.findByIdAndUpdate(
    queryId,
    { $set: orderData },
    { new: true, runValidators: true }
  );

  if (!result) throw new Error("Order not found");

  // Sync statuses (items, payment) based on order status change
  await syncOrderStatus(result);

  return result;
};

const deleteSingleOrderService = async (orderId: string | number) => {
  const queryId = typeof orderId === "string" ? new mongoose.Types.ObjectId(orderId) : orderId;
  const result = await orderModel.findByIdAndDelete(queryId);
  if (!result) throw new Error("Order not found");
  return result;
};

const deleteManyOrderService = async (orderIds: (string | number)[]) => {
  const queryIds = orderIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
    else if (typeof id === "number") return id;
    throw new Error(`Invalid ID format: ${id}`);
  });
  return await orderModel.deleteMany({ _id: { $in: queryIds } });
};

const assignShippingSlotService = async (orderId: string, slotId: string) => {
  const slot = await courierModel.findById(slotId);
  if (!slot) throw new Error("Invalid shipping slot");

  const order = await orderModel.findByIdAndUpdate(orderId, { courier: slot._id }, { new: true });
  if (!order) throw new Error("Order not found");
  return order;
};

const updateShippingStatusService = async (orderId: string, updates: IUpdateOrderItemStatus[]) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const updatedItems: any[] = [];
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

const requestReturnService = async (orderId: string, returnRequests: IReturnRequest[]) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const updatedItems: string[] = [];

  for (const req of returnRequests) {
    const { itemId, quantity, reason, note, shippingAddress, shippingMethod } = req;
    const item = order.items.find((i) => i.product.toString() === itemId);
    if (!item) throw new Error(`Item not found: ${itemId}`);

    if (item.status === "returned") throw new Error(`Item already returned: ${itemId}`);
    if (item.status !== "delivered") throw new Error(`Only delivered items can be returned: ${itemId}`);
    if (item.returnDetails?.status !== "none") throw new Error(`Return request already submitted: ${itemId}`);

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

    item.progress.push({ status: "return_requested", note: reason, updatedAt: new Date() });
    updatedItems.push(itemId);
  }

  await order.save();
  return { message: "Return request submitted successfully", updatedItems };
};

const handleReturnRequestService = async (orderId: string, returnDecisions: IReturnDecision[]) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");
  const updatedItems: string[] = [];

  for (const req of returnDecisions) {
    const { itemId, decision, trackingNumber, freeShippingLabel } = req;
    const item = order.items.find((i) => i.product.toString() === itemId);
    if (!item) throw new Error(`Item not found: ${itemId}`);

    if (item.status === "returned") throw new Error(`Item already returned: ${itemId}`);
    if (!item.returnDetails || item.returnDetails.status !== "pending") throw new Error(`No active return request: ${itemId}`);

    item.returnDetails.status = decision;
    if (trackingNumber) item.returnDetails.trackingNumber = trackingNumber;
    if (freeShippingLabel !== undefined) item.returnDetails.freeShippingLabel = freeShippingLabel;

    if (decision === "accepted") item.status = "returned";

    item.progress.push({
      status: `return_${decision}`,
      note: `Admin ${decision} the return request`,
      updatedAt: new Date(),
    });
    updatedItems.push(itemId);
  }

  await order.save();
  return { message: "Return request decisions processed", updatedItems };
};

const getOrdersByShippingSlotService = async (slotId: string) => {
  return await orderModel.find({ courier: new mongoose.Types.ObjectId(slotId) })
    .populate("user")
    .populate("items.product")
    .exec();
};

const addItemToOrderService = async (orderId: string, newItem: IOrderItem) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const existingItem = order.items.find(
    (i) => i.product.toString() === newItem.product.toString() && i.sku === newItem.sku
  );

  if (existingItem) {
    existingItem.quantity += newItem.quantity;
  } else {
    order.items.push(newItem);
  }

  calculateTotals(order);
  await order.save();
  return order;
};

const updateOrderItemService = async (orderId: string, itemId: string, updatedData: Partial<IOrderItem>) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const item = order.items.find((i) => i._id.toString() === itemId);
  if (!item) throw new Error("Item not found");

  Object.assign(item, updatedData);
  calculateTotals(order);
  await order.save();
  return order;
};

const deleteOrderItemService = async (orderId: string, itemId: string) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const itemIndex = order.items.findIndex((i) => i._id.toString() === itemId);
  if (itemIndex === -1) throw new Error("Item not found");

  order.items.splice(itemIndex, 1);
  calculateTotals(order);
  await order.save();

  return await orderModel.findById(orderId)
    .populate("user")
    .populate("items.product")
    .populate("coupon")
    .exec();
};

const getOrdersByUserService = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user id");
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");

  return await orderModel.find({ user: userId })
    .populate("user")
    .populate("coupon")
    .populate("courier")
    .sort({ createdAt: -1 });
};

const getReturnedProductsService = async (currentUser: any) => {
  const baseFilter: any = { "items.returnDetails.status": { $ne: "none" } };
  if (currentUser?.roleModel === "customRole") {
    baseFilter.user = currentUser.userId;
  }

  const orders = await orderModel.find(baseFilter)
    .populate("user")
    .populate("courier")
    .populate("items.product")
    .populate("coupon")
    .sort({ createdAt: -1 })
    .lean();

  // Optimizing the flatMap logic
  return orders.flatMap((order: any) =>
    order.items
      .filter((item: any) => item.returnDetails?.status && item.returnDetails.status !== "none")
      .map((item: any) => ({
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
      }))
  );
};

const createInvoiceService = async (orderId: string) => {
  const order = await orderModel.findById(orderId).populate("user").populate("items.product");
  if (!order) throw new Error("Order not found");

  const invoiceDir = path.join(__dirname, "../../../../public/invoices");
  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

  const filePath = path.join(invoiceDir, `${order.orderId}.pdf`);
  const html = invoiceTemplate({
    ...order.toObject(),
    createdAt: new Date(order.createdAt).toLocaleDateString(),
  });

  const pdfBuffer: any = await htmlPdf.generatePdf({ content: html }, { format: "A4", printBackground: true });
  fs.writeFileSync(filePath, pdfBuffer);

  return { url: `${config.base_url}/invoices/${order.orderId}.pdf` };
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
  createInvoiceService,
};
