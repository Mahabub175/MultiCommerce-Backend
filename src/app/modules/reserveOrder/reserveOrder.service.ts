import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { IReserveOrder, IReserveOrderProduct } from "./reserveOrder.interface";
import { reserveOrderModel } from "./reserveOrder.model";
import { productModel } from "../product/product.model";
import { validateReferences } from "../../utils/validateReferences";
import { userModel } from "../user/user.model";

const createReserveOrderService = async (reserveOrderData: IReserveOrder) => {
  const { user, deviceId, products } = reserveOrderData;

  if (!products?.length) throw new Error("No products provided.");

  if (user) {
    await validateReferences(userModel, user, "user");
  }

  const productIds = products.map((p) => p.product);
  await validateReferences(productModel, productIds, "product");

  const query: any = {};
  if (user) query.user = user;
  else if (deviceId) query.deviceId = deviceId;
  else throw new Error("Either user or deviceId must be provided.");

  let existingOrder = await reserveOrderModel.findOne(query);

  if (existingOrder) {
    for (const newItem of products) {
      const existingItem = existingOrder.products.find(
        (item: IReserveOrderProduct) => item.sku === newItem.sku
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
        existingItem.price = newItem.price;
        existingItem.weight = newItem.weight;
      } else {
        existingOrder.products.push(newItem);
      }

      const product =
        (await productModel.findOne({ "variants.sku": newItem.sku })) ||
        (await productModel.findOne({ sku: newItem.sku }));

      if (product) {
        const variant = product.variants?.find((v) => v.sku === newItem.sku);
        if (variant && variant.stock > 0) variant.stock -= newItem.quantity;
        else if (!variant && product.stock > 0)
          product.stock -= newItem.quantity;

        product.stock = product.variants?.length
          ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : product.stock;

        await product.save();
      }
    }

    await existingOrder.save();
    return existingOrder;
  }

  for (const newItem of products) {
    const product =
      (await productModel.findOne({ "variants.sku": newItem.sku })) ||
      (await productModel.findOne({ sku: newItem.sku }));

    if (product) {
      const variant = product.variants?.find((v) => v.sku === newItem.sku);
      if (variant && variant.stock > 0) variant.stock -= newItem.quantity;
      else if (!variant && product.stock > 0) product.stock -= newItem.quantity;

      product.stock = product.variants?.length
        ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : product.stock;

      await product.save();
    }
  }

  const result = await reserveOrderModel.create(reserveOrderData);
  return result;
};

const getAllReserveOrderService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  const query = reserveOrderModel
    .find()
    .populate("products.product")
    .populate("user");

  if (page || limit || searchText) {
    return await paginateAndSort(query, page, limit, searchText, searchFields);
  }

  const results = await query.sort({ createdAt: -1 }).exec();
  return { results };
};

const getSingleReserveOrderService = async (
  reserveOrderId: string | number
) => {
  const queryId =
    typeof reserveOrderId === "string"
      ? new mongoose.Types.ObjectId(reserveOrderId)
      : reserveOrderId;

  const result = await reserveOrderModel
    .findById(queryId)
    .populate("products.product")
    .populate("user")
    .exec();

  if (!result) throw new Error("ReserveOrder not found");
  return result;
};

const getSingleReserveOrderByUserService = async (userId: string) => {
  const query = mongoose.Types.ObjectId.isValid(userId)
    ? { $or: [{ user: userId }, { deviceId: userId }] }
    : { deviceId: userId };

  const result = await reserveOrderModel
    .find(query)
    .populate("products.product")
    .populate("user")
    .exec();

  return result.map((order) => ({
    _id: order._id,
    user: order.user,
    products: order.products.map((item: any) => {
      const product = item.product;
      const matchingVariant = product?.variants?.find(
        (v: any) => v.sku === item.sku
      );
      return {
        productId: product?._id,
        slug: product?.slug,
        productName: product?.name,
        sku: item.sku,
        price: item.price,
        image: matchingVariant?.image ?? product?.mainImage,
        quantity: item.quantity,
        weight: item.weight,
        totalPrice: item.price * item.quantity,
        variant: matchingVariant || null,
      };
    }),
    status: order.status,
  }));
};

export const updateSingleReserveOrderService = async (
  reserveOrderId: string | number,
  updatedProduct: IReserveOrderProduct
) => {
  const queryId =
    typeof reserveOrderId === "string"
      ? new mongoose.Types.ObjectId(reserveOrderId)
      : reserveOrderId;

  const order = await reserveOrderModel.findById(queryId);
  if (!order) throw new Error("ReserveOrder not found");

  await validateReferences(productModel, updatedProduct.product, "product");

  const existingItem = order.products.find(
    (item) => item.sku === updatedProduct.sku
  );

  const product =
    (await productModel.findOne({ "variants.sku": updatedProduct.sku })) ||
    (await productModel.findOne({ sku: updatedProduct.sku }));

  if (!product) throw new Error("Product not found");

  const variant = product.variants?.find((v) => v.sku === updatedProduct.sku);

  if (existingItem) {
    const prevQty = existingItem.quantity;
    if (variant) variant.stock += prevQty;
    else product.stock += prevQty;

    existingItem.quantity = updatedProduct.quantity ?? existingItem.quantity;
    existingItem.price = updatedProduct.price ?? existingItem.price;
    existingItem.weight = updatedProduct.weight ?? existingItem.weight;

    if (variant) variant.stock -= existingItem.quantity;
    else product.stock -= existingItem.quantity;
  } else {
    order.products.push(updatedProduct);

    if (variant && variant.stock > 0) variant.stock -= updatedProduct.quantity;
    else if (!variant && product.stock > 0)
      product.stock -= updatedProduct.quantity;
  }

  product.stock = product.variants?.length
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : product.stock;

  await product.save();
  await order.save();

  return order;
};

const updateReserveOrderProductQuantityService = async (
  reserveOrderId: string | number,
  productId: string,
  sku: string,
  newQuantity: number
) => {
  const queryId =
    typeof reserveOrderId === "string"
      ? new mongoose.Types.ObjectId(reserveOrderId)
      : reserveOrderId;

  const order = await reserveOrderModel.findById(queryId);
  if (!order) throw new Error("ReserveOrder not found");

  await validateReferences(productModel, productId, "product");

  const existingItem = order.products.find(
    (item) =>
      item.product.toString() === productId.toString() && item.sku === sku
  );
  if (!existingItem) throw new Error("Product not found in reserve order");

  const product =
    (await productModel.findOne({ "variants.sku": sku })) ||
    (await productModel.findOne({ sku }));
  if (!product) throw new Error("Product not found");

  const variant = product.variants?.find((v) => v.sku === sku);

  const prevQuantity = existingItem.quantity;
  const diff = newQuantity - prevQuantity;

  if (diff > 0) {
    if (variant) variant.stock -= diff;
    else product.stock -= diff;
  } else if (diff < 0) {
    if (variant) variant.stock += Math.abs(diff);
    else product.stock += Math.abs(diff);
  }

  product.stock = product.variants?.length
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : product.stock;

  existingItem.quantity = newQuantity;

  await product.save();
  await order.save();

  return order;
};

const deleteProductFromReserveOrderService = async (
  reserveOrderId: string,
  sku: string
) => {
  const order = await reserveOrderModel.findById(reserveOrderId);
  if (!order) throw new Error("ReserveOrder not found");

  const removedItem = order.products.find((item) => item.sku === sku);
  if (!removedItem) throw new Error("Product not found in order");

  const product =
    (await productModel.findOne({ "variants.sku": sku })) ||
    (await productModel.findOne({ sku }));

  if (product) {
    const variant = product.variants?.find((v) => v.sku === sku);
    if (variant) variant.stock += removedItem.quantity;
    else product.stock += removedItem.quantity;

    product.stock = product.variants?.length
      ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : product.stock;

    await product.save();
  }

  order.products = order.products.filter((item) => item.sku !== sku);
  await order.save();

  return order;
};

const deleteSingleReserveOrderService = async (
  reserveOrderId: string | number
) => {
  const queryId =
    typeof reserveOrderId === "string"
      ? new mongoose.Types.ObjectId(reserveOrderId)
      : reserveOrderId;

  const reserveOrder = await reserveOrderModel.findById(queryId);
  if (!reserveOrder) throw new Error("ReserveOrder not found");

  for (const item of reserveOrder.products) {
    const product =
      (await productModel.findOne({ "variants.sku": item.sku })) ||
      (await productModel.findOne({ sku: item.sku }));

    if (product) {
      const variant = product.variants?.find((v) => v.sku === item.sku);
      if (variant) variant.stock += item.quantity;
      else product.stock += item.quantity;

      product.stock = product.variants?.length
        ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : product.stock;

      await product.save();
    }
  }

  const result = await reserveOrderModel.findByIdAndDelete(queryId).exec();
  return result;
};

const deleteManyReserveOrderService = async (
  reserveOrderIds: (string | number)[]
) => {
  const queryIds = reserveOrderIds.map((id) =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : id
  );

  const orders = await reserveOrderModel.find({ _id: { $in: queryIds } });

  if (!orders.length) throw new Error("No reserve orders found");

  for (const order of orders) {
    for (const item of order.products) {
      const product =
        (await productModel.findOne({ "variants.sku": item.sku })) ||
        (await productModel.findOne({ sku: item.sku }));

      if (product) {
        const variant = product.variants?.find((v) => v.sku === item.sku);
        if (variant) variant.stock += item.quantity;
        else product.stock += item.quantity;

        product.stock = product.variants?.length
          ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : product.stock;

        await product.save();
      }
    }
  }

  const result = await reserveOrderModel
    .deleteMany({
      _id: { $in: queryIds },
    })
    .exec();

  return result;
};

export const reserveOrderServices = {
  createReserveOrderService,
  getAllReserveOrderService,
  getSingleReserveOrderService,
  getSingleReserveOrderByUserService,
  updateSingleReserveOrderService,
  updateReserveOrderProductQuantityService,
  deleteProductFromReserveOrderService,
  deleteSingleReserveOrderService,
  deleteManyReserveOrderService,
};
