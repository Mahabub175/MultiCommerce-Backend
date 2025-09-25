import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { cartModel } from "./cart.model";
import { ICart } from "./cart.interface";

//Create a cart into database
const createCartService = async (cartData: ICart) => {
  const { user, deviceId, sku } = cartData;

  const query: any = { sku };

  if (user) query.user = user;
  if (deviceId) query.deviceId = deviceId;

  const existingCart = await cartModel.findOne(query);

  if (existingCart) {
    throw new Error("This product is already in your cart.");
  }

  const result = await cartModel.create(cartData);
  return result;
};

// Get all cart with optional pagination
const getAllCartService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = cartModel.find().populate("product").populate("user");

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    return result;
  } else {
    results = await cartModel
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

//Get single cart
const getSingleCartService = async (cartId: number | string) => {
  const queryId =
    typeof cartId === "string" ? new mongoose.Types.ObjectId(cartId) : cartId;

  const result = await cartModel
    .findById(queryId)
    .populate("product")
    .populate("user")
    .exec();

  if (!result) {
    throw new Error("Cart not found");
  }

  return result;
};

const getSingleCartByUserService = async (userId: string) => {
  const query = mongoose.Types.ObjectId.isValid(userId)
    ? { $or: [{ user: userId }, { deviceId: userId }] }
    : { deviceId: userId };

  const result = await cartModel
    .find(query)
    .populate({
      path: "product",
      select: "name price sku variants mainImage slug",
      populate: {
        path: "variants.attributeCombination",
        model: "attributeOption",
        populate: {
          path: "attribute",
          model: "attribute",
          populate: {
            path: "options",
            model: "attributeOption",
          },
        },
      },
    })
    .populate({
      path: "user",
      select: "name email",
    })
    .exec();

  const cartDetails = result.map((cartItem) => {
    const product = cartItem.product as any;

    let matchingVariant = null;
    if (product.sku === cartItem.sku) {
      if (product.variants?.length > 0) {
        matchingVariant = product.variants[0];
      }
    } else {
      matchingVariant = product.variants?.find(
        (variant: any) => variant.sku === cartItem.sku
      );
    }

    return {
      _id: cartItem._id,
      user: cartItem.user,
      productId: product._id,
      slug: product.slug,
      productName: product.name,
      sku: cartItem.sku,
      price: cartItem.price,
      image: matchingVariant?.image ?? product?.mainImage,
      quantity: cartItem.quantity,
      weight: cartItem.weight,
      totalPrice: cartItem.price * cartItem.quantity,
      variant: matchingVariant || null,
    };
  });

  return cartDetails;
};

//Update single cart
const updateSingleCartService = async (
  cartId: string | number,
  cartData: ICart
) => {
  const queryId =
    typeof cartId === "string" ? new mongoose.Types.ObjectId(cartId) : cartId;

  const result = await cartModel
    .findByIdAndUpdate(
      queryId,
      { $set: cartData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Cart not found");
  }

  return result;
};

//Delete single cart
const deleteSingleCartService = async (cartId: string | number) => {
  const queryId =
    typeof cartId === "string" ? new mongoose.Types.ObjectId(cartId) : cartId;

  const result = await cartModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Cart not found");
  }

  return result;
};

//Delete many cart
const deleteManyCartService = async (cartIds: (string | number)[]) => {
  const queryIds = cartIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await cartModel.deleteMany({ _id: { $in: queryIds } }).exec();

  return result;
};

export const cartServices = {
  createCartService,
  getAllCartService,
  getSingleCartService,
  getSingleCartByUserService,
  updateSingleCartService,
  deleteSingleCartService,
  deleteManyCartService,
};
