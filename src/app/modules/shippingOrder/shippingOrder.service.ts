import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { IShippingOrder } from "./shippingOrder.interface";
import { shippingOrderModel } from "./shippingOrder.model";
import {
  IReturnDecision,
  IReturnRequest,
} from "../shippingSlot/shippingSlot.interface";
import { orderModel } from "../order/order.model";
import { shippingSlotModel } from "../shippingSlot/shippingSlot.model";

const createShippingOrderService = async (data: IShippingOrder) => {
  const { shippingSlot, selectedSlot } = data;

  const courier = await shippingSlotModel.findById(shippingSlot);
  if (!courier) throw new Error("Invalid courier / shippingSlot");

  const slotExists = courier.slots.some(
    (slot: any) => slot._id.toString() === selectedSlot.toString()
  );

  if (!slotExists)
    throw new Error("Selected slot does not belong to this courier");

  const result = await shippingOrderModel.create(data);
  return result;
};

const getAllShippingOrdersService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  const query = shippingOrderModel
    .find()
    .populate("shippingSlot")
    .populate({
      path: "deliveryList.order",
      populate: { path: "user", select: "-password" },
    });

  let result;

  if (page || limit || searchText) {
    result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
  } else {
    const results = await query.sort({ createdAt: -1 }).exec();
    result = { results };
  }

  const processOrder = (order: any) => {
    if (!order.shippingSlot) return order;

    const courier = order.shippingSlot;

    if (courier.slots && order.selectedSlot) {
      order.selectedSlotDetails = courier.slots.find(
        (slot: any) => slot._id.toString() === order.selectedSlot.toString()
      );
    }

    return order;
  };

  if (result?.results) {
    result.results = result.results.map(processOrder);
  }

  return result;
};

const getSingleShippingOrderService = async (
  shippingOrderId: string | number
) => {
  const queryId =
    typeof shippingOrderId === "string"
      ? new mongoose.Types.ObjectId(shippingOrderId)
      : shippingOrderId;

  const result = await shippingOrderModel
    .findById(queryId)
    .populate("shippingSlot")
    .populate({
      path: "deliveryList.order",
      populate: { path: "user", select: "-password" },
    })
    .lean()
    .exec();

  if (!result) throw new Error("Shipping order not found");

  if (result.shippingSlot && result.selectedSlot) {
    const courier = result.shippingSlot as any;
    const selectedSlotDetails = courier.slots.find(
      (slot: any) => slot._id.toString() === result.selectedSlot.toString()
    );
    result.selectedSlotDetails = selectedSlotDetails;
  }

  return result;
};

const updateSingleShippingOrderService = async (
  orderId: string | number,
  data: Partial<IShippingOrder>
) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const existing = await shippingOrderModel.findById(queryId);
  if (!existing) throw new Error("Shipping order not found");

  const courierId = data.shippingSlot || existing.shippingSlot;
  const slotId = data.selectedSlot || existing.selectedSlot;

  const courier = await shippingSlotModel.findById(courierId);
  if (!courier) throw new Error("Invalid shippingSlot / courier");

  const slotExists = courier.slots.some(
    (slot: any) => slot._id.toString() === slotId.toString()
  );
  if (!slotExists)
    throw new Error("Selected slot does not belong to this courier");

  const result = await shippingOrderModel
    .findByIdAndUpdate(
      queryId,
      { $set: data },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) throw new Error("Shipping order not found");

  const updatedResult = result.toObject();
  updatedResult.selectedSlotDetails = courier.slots.find(
    (slot: any) => slot._id.toString() === updatedResult.selectedSlot.toString()
  );

  return updatedResult;
};

const updateShippingStatusService = async (
  orderId: string | number,
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "cancelled"
) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await shippingOrderModel
    .findByIdAndUpdate(queryId, { shippingStatus: status }, { new: true })
    .exec();

  if (!result) throw new Error("Shipping order not found");
  return result;
};

const requestReturnService = async (
  shippingOrderId: string,
  returnRequests: IReturnRequest[]
) => {
  const shippingOrder = await shippingOrderModel.findById(shippingOrderId);
  if (!shippingOrder) throw new Error("Shipping order not found");

  const updatedOrders: string[] = [];

  for (const reqItem of returnRequests) {
    const { orderId, reason } = reqItem;
    const item = shippingOrder.deliveryList.find(
      (d) => d.order.toString() === orderId
    );
    if (!item) throw new Error(`Delivery item not found: ${orderId}`);
    if (item.status !== "delivered")
      throw new Error(`Only delivered orders can be returned: ${orderId}`);
    if (item.returnRequested)
      throw new Error(`Return request already submitted: ${orderId}`);

    item.returnRequested = true;
    item.returnStatus = "pending";
    item.returnReason = reason;

    item.progress.push({
      status: "return_requested",
      note: reason,
      updatedAt: new Date(),
    });

    updatedOrders.push(orderId);
  }

  await shippingOrder.save();

  return { message: "Return requests submitted successfully", updatedOrders };
};

const handleReturnRequestService = async (
  shippingOrderId: string,
  returnDecisions: IReturnDecision[]
) => {
  const shippingOrder = await shippingOrderModel.findById(shippingOrderId);
  if (!shippingOrder) throw new Error("Shipping order not found");

  const updatedOrders: string[] = [];

  for (const { orderId, decision } of returnDecisions) {
    const item = shippingOrder.deliveryList.find(
      (d) => d.order.toString() === orderId
    );
    if (!item) throw new Error(`Delivery item not found: ${orderId}`);
    if (!item.returnRequested || item.returnStatus !== "pending") {
      throw new Error(`No active return request for order: ${orderId}`);
    }

    item.returnStatus = decision;

    if (decision === "accepted") {
      item.status = "returned";

      await orderModel.findByIdAndUpdate(orderId, {
        $set: { orderStatus: "returned" },
      });
    }

    item.progress.push({
      status: `return_${decision}`,
      note: `Admin ${decision} the return request`,
      updatedAt: new Date(),
    });

    updatedOrders.push(orderId);
  }

  await shippingOrder.save();

  return {
    message: `Return requests processed for ${updatedOrders.length} order(s)`,
    updatedOrders,
  };
};

const deleteSingleShippingOrderService = async (orderId: string | number) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await shippingOrderModel.findByIdAndDelete(queryId).exec();
  if (!result) throw new Error("Shipping order not found");
  return result;
};

const deleteManyShippingOrderService = async (
  orderIds: (string | number)[]
) => {
  const queryIds = orderIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await shippingOrderModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();
  return result;
};

const assignShippingSlotService = async (orderId: string, slotId: string) => {
  const slot = await shippingSlotModel.findById(slotId);
  if (!slot) throw new Error("Invalid shipping slot");

  const result = await shippingOrderModel.findByIdAndUpdate(
    orderId,
    { shippingSlot: slot._id },
    { new: true }
  );
  return result;
};

const getOrdersByShippingSlotService = async (slotId: string) => {
  const result = await shippingOrderModel
    .find({ shippingSlot: new mongoose.Types.ObjectId(slotId) })
    .populate("order")
    .populate("user")
    .exec();

  return result;
};

export const shippingOrderServices = {
  createShippingOrderService,
  getAllShippingOrdersService,
  getSingleShippingOrderService,
  updateSingleShippingOrderService,
  updateShippingStatusService,
  requestReturnService,
  handleReturnRequestService,
  deleteSingleShippingOrderService,
  deleteManyShippingOrderService,
  assignShippingSlotService,
  getOrdersByShippingSlotService,
};
