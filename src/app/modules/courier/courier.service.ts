import mongoose from "mongoose";
import { ICourier } from "./courier.interface";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { deleteFileSync } from "../../utils/deleteFilesFromStorage";
import { courierModel } from "./courier.model";
import {
  calculateShippingCost,
  IShippingCalculationInput,
} from "../../utils/shippingCostCalculator";
import { productModel } from "../product/product.model";

const createCourierService = async (data: ICourier) => {
  const result = await courierModel.create(data);
  return result;
};

const getAllCouriersService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;
  if (page || limit || searchText) {
    const query = courierModel.find();
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    result.results = formatResultImage<ICourier>(
      result.results,
      "attachment"
    ) as ICourier[];
    return result;
  } else {
    results = await courierModel.find().sort({ createdAt: -1 }).exec();
    results = formatResultImage(results, "attachment");
    return { results };
  }
};

const getSingleCourierService = async (slotId: string | number) => {
  const queryId =
    typeof slotId === "string" ? new mongoose.Types.ObjectId(slotId) : slotId;

  const result = await courierModel.findById(queryId).exec();
  if (!result) throw new Error("Shipping slot not found");
  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<ICourier>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }
  return result;
};

const updateCourierService = async (
  slotId: string | number,
  shippingData: Partial<ICourier>
) => {
  const queryId =
    typeof slotId === "string" ? new mongoose.Types.ObjectId(slotId) : slotId;

  const existingCourier = await courierModel.findById(queryId);
  if (!existingCourier) throw new Error("Shipping Slot not found");

  if (
    shippingData.attachment &&
    existingCourier.attachment !== shippingData.attachment
  ) {
    deleteFileSync(existingCourier.attachment as string);
  }

  const result = await courierModel
    .findByIdAndUpdate(
      queryId,
      { $set: shippingData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) throw new Error("Shipping slot not found");
  return result;
};

const deleteSingleCourierService = async (slotId: string | number) => {
  const queryId =
    typeof slotId === "string" ? new mongoose.Types.ObjectId(slotId) : slotId;

  const courier = await courierModel.findById(queryId);
  if (!courier) throw new Error("Shipping Slot not found");

  if (courier.attachment) {
    deleteFileSync(courier.attachment as string);
  }

  const result = await courierModel.findByIdAndDelete(queryId).exec();
  if (!result) throw new Error("Shipping slot not found");
  return result;
};

const deleteManyCourierService = async (slotIds: (string | number)[]) => {
  const queryIds = slotIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const slots = await courierModel.find({ _id: { $in: queryIds } }).exec();

  for (const slot of slots) {
    if (slot.attachment) {
      deleteFileSync(slot.attachment as string);
    }
  }

  const result = await courierModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

const calculateShippingCostService = async (payload: {
  courierId: string;
  slotId: string;
  items: Array<{
    productId?: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    quantity: number;
  }>;
  shippingAddress: {
    city?: string;
    zipCode?: string;
    country?: string;
  };
}) => {
  const { courierId, slotId, items, shippingAddress } = payload;

  // Get courier with the slot
  const courier = await courierModel.findById(courierId).exec();
  if (!courier) {
    throw new Error("Courier not found");
  }

  // Prepare items with product dimensions if productId is provided
  const preparedItems = await Promise.all(
    items.map(async (item) => {
      // If productId is provided, fetch product to get dimensions
      if (item.productId) {
        const product = await productModel.findById(item.productId).exec();
        if (product) {
          return {
            weight: item.weight || product.weight || 0,
            length: item.length || product.length || 0,
            width: item.width || product.width || 0,
            height: item.height || product.height || 0,
            quantity: item.quantity,
          };
        }
      }
      // Otherwise use provided values
      return {
        weight: item.weight || 0,
        length: item.length || 0,
        width: item.width || 0,
        height: item.height || 0,
        quantity: item.quantity,
      };
    })
  );

  // Calculate shipping cost
  const calculationInput: IShippingCalculationInput = {
    slotId,
    courier,
    items: preparedItems,
    shippingAddress,
  };

  const result = await calculateShippingCost(calculationInput);
  return result;
};

export const courierServices = {
  createCourierService,
  getAllCouriersService,
  getSingleCourierService,
  updateCourierService,
  deleteSingleCourierService,
  deleteManyCourierService,
  calculateShippingCostService,
};
