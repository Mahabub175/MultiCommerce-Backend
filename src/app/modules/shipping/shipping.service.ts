import mongoose from "mongoose";
import { shippingSlotModel, shippingOrderModel } from "./shipping.model";
import { IShippingSlot, IShippingOrder } from "./shipping.interface";
import { paginateAndSort } from "../../utils/paginateAndSort";
import fs from "fs";
import path from "path";

const createShippingSlotService = async (data: IShippingSlot) => {
  const result = await shippingSlotModel.create(data);
  return result;
};

const getAllShippingSlotsService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  if (page || limit || searchText) {
    const query = shippingSlotModel.find();
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    return result;
  } else {
    const results = await shippingSlotModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    return { results };
  }
};

const getSingleShippingSlotService = async (slotId: string | number) => {
  const queryId =
    typeof slotId === "string" ? new mongoose.Types.ObjectId(slotId) : slotId;

  const result = await shippingSlotModel.findById(queryId).exec();
  if (!result) throw new Error("Shipping slot not found");
  return result;
};

const updateShippingSlotService = async (
  slotId: string | number,
  shippingData: Partial<IShippingSlot>
) => {
  const queryId =
    typeof slotId === "string" ? new mongoose.Types.ObjectId(slotId) : slotId;

  const existingShippingSlot = await shippingSlotModel.findById(queryId);
  if (!existingShippingSlot) throw new Error("Shipping Slot not found");

  if (
    shippingData.attachment &&
    existingShippingSlot.attachment !== shippingData.attachment
  ) {
    const prevFile = path.join(
      process.cwd(),
      "uploads",
      path.basename(existingShippingSlot.attachment || "")
    );
    if (fs.existsSync(prevFile)) {
      fs.unlinkSync(prevFile);
    }
  }

  const result = await shippingSlotModel
    .findByIdAndUpdate(
      queryId,
      { $set: shippingData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) throw new Error("Shipping slot not found");
  return result;
};

const deleteSingleShippingSlotService = async (slotId: string | number) => {
  const queryId =
    typeof slotId === "string" ? new mongoose.Types.ObjectId(slotId) : slotId;

  const shippingSlot = await shippingSlotModel.findById(queryId);
  if (!shippingSlot) throw new Error("Shipping Slot not found");

  if (shippingSlot.attachment) {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      path.basename(shippingSlot.attachment)
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const result = await shippingSlotModel.findByIdAndDelete(queryId).exec();
  if (!result) throw new Error("Shipping slot not found");
  return result;
};

const deleteManyShippingSlotService = async (slotIds: (string | number)[]) => {
  const queryIds = slotIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await shippingSlotModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();
  return result;
};

const createShippingOrderService = async (data: IShippingOrder) => {
  const result = await shippingOrderModel.create(data);
  return result;
};

const getAllShippingOrdersService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  if (page || limit || searchText) {
    const query = shippingOrderModel
      .find()
      .populate("order")
      .populate("user")
      .populate("shippingSlot");

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    return result;
  } else {
    const results = await shippingOrderModel
      .find()
      .populate("order")
      .populate("user")
      .populate("shippingSlot")
      .sort({ createdAt: -1 })
      .exec();

    return { results };
  }
};

const getSingleShippingOrderService = async (orderId: string | number) => {
  const queryId =
    typeof orderId === "string"
      ? new mongoose.Types.ObjectId(orderId)
      : orderId;

  const result = await shippingOrderModel
    .findById(queryId)
    .populate("order")
    .populate("user")
    .populate("shippingSlot")
    .exec();

  if (!result) throw new Error("Shipping order not found");
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

  const result = await shippingOrderModel
    .findByIdAndUpdate(
      queryId,
      { $set: data },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) throw new Error("Shipping order not found");
  return result;
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

export const shippingServices = {
  createShippingSlotService,
  getAllShippingSlotsService,
  getSingleShippingSlotService,
  updateShippingSlotService,
  deleteSingleShippingSlotService,
  deleteManyShippingSlotService,

  createShippingOrderService,
  getAllShippingOrdersService,
  getSingleShippingOrderService,
  updateSingleShippingOrderService,
  updateShippingStatusService,
  deleteSingleShippingOrderService,
  deleteManyShippingOrderService,
  assignShippingSlotService,
  getOrdersByShippingSlotService,
};
