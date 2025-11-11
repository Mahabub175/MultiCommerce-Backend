import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { IReserveOrder } from "./reserveOrder.interface";
import { reserveOrderModel } from "./reserveOrder.model";
import { productModel } from "../product/product.model";

//Create a reserveOrder into database
const createReserveOrderService = async (reserveOrderData: IReserveOrder) => {
  const { user, deviceId, sku } = reserveOrderData;

  const query: any = { sku };
  if (user) query.user = user;
  if (deviceId) query.deviceId = deviceId;

  const existingReserveOrder = await reserveOrderModel.findOne(query);
  if (existingReserveOrder) {
    throw new Error("This product is already in your reserveOrder.");
  }

  const result = await reserveOrderModel.create(reserveOrderData);

  const product = await productModel.findOne({ "variants.sku": sku });

  if (product && product.isVariant && product.variants.length > 0) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant && variant.stock > 0) {
      variant.stock -= 1;
      product.stock = product.variants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      );
      await product.save();
    }
  } else {
    const mainProduct = await productModel.findOne({ sku });
    if (mainProduct && mainProduct.stock > 0) {
      mainProduct.stock -= 1;
      mainProduct.stock =
        mainProduct.stock && mainProduct.stock > 0
          ? mainProduct.stock - 1
          : mainProduct.stock;
      await mainProduct.save();
    }
  }

  return result;
};

// Get all reserveOrder with optional pagination
const getAllReserveOrderService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page || limit || searchText) {
    const query = reserveOrderModel.find().populate("product").populate("user");

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await reserveOrderModel
      .find()
      .populate("product")
      .populate("user")
      .sort({ createdAt: -1 })
      .exec();

    return {
      results,
    };
  }
};

//Get single reserveOrder
const getSingleReserveOrderService = async (
  reserveOrderId: number | string
) => {
  const queryId =
    typeof reserveOrderId === "string"
      ? new mongoose.Types.ObjectId(reserveOrderId)
      : reserveOrderId;

  const result = await reserveOrderModel
    .findById(queryId)
    .populate("product")
    .populate("user")
    .exec();

  if (!result) {
    throw new Error("ReserveOrder not found");
  }

  return result;
};

const getSingleReserveOrderByUserService = async (userId: string) => {
  const query = mongoose.Types.ObjectId.isValid(userId)
    ? { $or: [{ user: userId }, { deviceId: userId }] }
    : { deviceId: userId };

  const result = await reserveOrderModel
    .find(query)
    .populate("product")
    .populate("user")
    .exec();

  const reserveOrderDetails = result.map((reserveOrderItem) => {
    const product = reserveOrderItem.product as any;

    let matchingVariant = null;
    if (product.sku === reserveOrderItem.sku) {
      if (product.variants?.length > 0) {
        matchingVariant = product.variants[0];
      }
    } else {
      matchingVariant = product.variants?.find(
        (variant: any) => variant.sku === reserveOrderItem.sku
      );
    }

    return {
      _id: reserveOrderItem._id,
      user: reserveOrderItem.user,
      productId: product._id,
      slug: product.slug,
      productName: product.name,
      sku: reserveOrderItem.sku,
      price: reserveOrderItem.price,
      image: matchingVariant?.image ?? product?.mainImage,
      quantity: reserveOrderItem.quantity,
      weight: reserveOrderItem.weight,
      totalPrice: reserveOrderItem.price * reserveOrderItem.quantity,
      variant: matchingVariant || null,
    };
  });

  return reserveOrderDetails;
};

//Update single reserveOrder
const updateSingleReserveOrderService = async (
  reserveOrderId: string | number,
  reserveOrderData: IReserveOrder
) => {
  const queryId =
    typeof reserveOrderId === "string"
      ? new mongoose.Types.ObjectId(reserveOrderId)
      : reserveOrderId;

  const existingReserveOrder = await reserveOrderModel.findById(queryId);
  if (!existingReserveOrder) {
    throw new Error("ReserveOrder not found");
  }

  const oldSku = existingReserveOrder.sku;
  const newSku = reserveOrderData.sku;

  if (oldSku !== newSku) {
    const oldProduct =
      (await productModel.findOne({ "variants.sku": oldSku })) ||
      (await productModel.findOne({ sku: oldSku }));

    if (oldProduct) {
      const oldVariant = oldProduct.variants?.find((v) => v.sku === oldSku);
      if (oldVariant) {
        oldVariant.stock += 1;
      } else if (oldProduct.sku === oldSku) {
        oldProduct.stock += 1;
      }
      oldProduct.stock = oldProduct.variants?.length
        ? oldProduct.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : oldProduct.stock;
      await oldProduct.save();
    }

    const newProduct =
      (await productModel.findOne({ "variants.sku": newSku })) ||
      (await productModel.findOne({ sku: newSku }));

    if (newProduct) {
      const newVariant = newProduct.variants?.find((v) => v.sku === newSku);
      if (newVariant && newVariant.stock > 0) {
        newVariant.stock -= 1;
      } else if (newProduct.sku === newSku && newProduct.stock > 0) {
        newProduct.stock -= 1;
      }
      newProduct.stock = newProduct.variants?.length
        ? newProduct.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : newProduct.stock;
      await newProduct.save();
    }
  }

  const result = await reserveOrderModel
    .findByIdAndUpdate(
      queryId,
      { $set: reserveOrderData },
      { new: true, runValidators: true }
    )
    .exec();

  return result;
};

//Delete single reserveOrder
const deleteSingleReserveOrderService = async (
  reserveOrderId: string | number
) => {
  const queryId =
    typeof reserveOrderId === "string"
      ? new mongoose.Types.ObjectId(reserveOrderId)
      : reserveOrderId;

  const result = await reserveOrderModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("ReserveOrder not found");
  }

  return result;
};

//Delete many reserveOrder
const deleteManyReserveOrderService = async (
  reserveOrderIds: (string | number)[]
) => {
  const queryIds = reserveOrderIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await reserveOrderModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const reserveOrderServices = {
  createReserveOrderService,
  getAllReserveOrderService,
  getSingleReserveOrderService,
  getSingleReserveOrderByUserService,
  updateSingleReserveOrderService,
  deleteSingleReserveOrderService,
  deleteManyReserveOrderService,
};
