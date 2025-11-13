import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { cartModel } from "./cart.model";
import { ICart, ICartProduct } from "./cart.interface";
import { validateReferences } from "../../utils/validateReferences";
import { userModel } from "../user/user.model";
import { productModel } from "../product/product.model";

// Create or update cart
const createCartService = async (cartData: ICart) => {
  const { user, deviceId, products } = cartData;

  if (!products?.length) {
    throw new Error("No products provided for the cart.");
  }

  if (user) {
    await validateReferences(userModel, user, "user");
  }

  const productIds = products.map((p) => p.product);
  await validateReferences(productModel, productIds, "product");

  const query: any = {};
  if (user) query.user = user;
  else if (deviceId) query.deviceId = deviceId;
  else throw new Error("Either user or deviceId must be provided.");

  let existingCart = await cartModel.findOne(query);

  if (existingCart) {
    for (const newItem of products) {
      const existingItem = existingCart.products.find(
        (item: ICartProduct) => item.sku === newItem.sku
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
        existingItem.price = newItem.price;
        existingItem.weight = newItem.weight;
      } else {
        existingCart.products.push(newItem);
      }
    }

    await existingCart.save();
    return existingCart;
  }

  const newCart = await cartModel.create(cartData);
  return newCart;
};

const getAllCartService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  const query = cartModel.find().populate("products.product").populate("user");

  if (page || limit || searchText) {
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );
    return result;
  }

  results = await query.sort({ createdAt: -1 }).exec();
  return { results };
};

// Get single cart by ID
const getSingleCartService = async (cartId: string | number) => {
  const queryId =
    typeof cartId === "string" ? new mongoose.Types.ObjectId(cartId) : cartId;

  const result = await cartModel
    .findById(queryId)
    .populate("products.product")
    .populate("user")
    .exec();

  if (!result) throw new Error("Cart not found");
  return result;
};

// Get cart by user or deviceId
const getSingleCartByUserService = async (userId: string) => {
  const query = mongoose.Types.ObjectId.isValid(userId)
    ? { $or: [{ user: userId }, { deviceId: userId }] }
    : { deviceId: userId };

  const result = await cartModel
    .findOne(query)
    .populate("products.product")
    .populate("user")
    .exec();

  if (!result) return [];

  const cartDetails = result.products.map((item: any) => {
    const product = item.product as any;
    const matchingVariant = product?.variants?.find(
      (variant: any) => variant.sku === item.sku
    );

    return {
      _id: result._id,
      user: result.user,
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
  });

  return cartDetails;
};

// Update a product inside cart
const updateSingleCartService = async (
  cartId: string | number,
  updatedProduct: ICartProduct
) => {
  const queryId =
    typeof cartId === "string" ? new mongoose.Types.ObjectId(cartId) : cartId;

  const cart = await cartModel.findById(queryId);
  if (!cart) throw new Error("Cart not found");

  await validateReferences(productModel, updatedProduct.product, "product");

  const existingItem = cart.products.find(
    (item: ICartProduct) => item.sku === updatedProduct.sku
  );

  if (existingItem) {
    existingItem.quantity = updatedProduct.quantity ?? existingItem.quantity;
    existingItem.price = updatedProduct.price ?? existingItem.price;
    existingItem.weight = updatedProduct.weight ?? existingItem.weight;
  } else {
    cart.products.push(updatedProduct);
  }

  await cart.save();
  return cart;
};

const updateCartProductQuantityService = async (
  cartId: string | number,
  productId: string,
  sku: string,
  newQuantity: number
) => {
  const queryId =
    typeof cartId === "string" ? new mongoose.Types.ObjectId(cartId) : cartId;

  const cart = await cartModel.findById(queryId);
  if (!cart) throw new Error("Cart not found");

  await validateReferences(productModel, productId, "product");

  const productItem = cart.products.find(
    (item: ICartProduct) =>
      item.product.toString() === productId.toString() && item.sku === sku
  );

  if (!productItem) throw new Error("Product not found in cart");

  productItem.quantity = newQuantity;

  await cart.save();

  return cart;
};

// Remove a product from cart
const deleteProductsFromCartService = async (
  cartId: string,
  identifiers: { skus?: string[]; productIds?: string[] }
) => {
  const { skus = [], productIds = [] } = identifiers;

  const cart = await cartModel.findById(cartId);
  if (!cart) throw new Error("Cart not found");

  if (skus.length === 0 && productIds.length === 0) {
    throw new Error("No product identifiers provided for deletion");
  }
  cart.products = cart.products.filter((item: ICartProduct) => {
    const skuMatch = skus.includes(item.sku);
    const idMatch = productIds.includes(item.product?.toString());
    return !skuMatch && !idMatch;
  });

  await cart.save();
  return cart;
};

// Delete entire cart
const deleteSingleCartService = async (cartId: string | number) => {
  const queryId =
    typeof cartId === "string" ? new mongoose.Types.ObjectId(cartId) : cartId;

  const result = await cartModel.findByIdAndDelete(queryId).exec();
  if (!result) throw new Error("Cart not found");

  return result;
};

// Delete multiple carts
const deleteManyCartService = async (cartIds: (string | number)[]) => {
  const queryIds = cartIds.map((id) =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : id
  );

  const result = await cartModel.deleteMany({ _id: { $in: queryIds } }).exec();
  return result;
};

export const cartServices = {
  createCartService,
  getAllCartService,
  getSingleCartService,
  getSingleCartByUserService,
  updateSingleCartService,
  updateCartProductQuantityService,
  deleteProductsFromCartService,
  deleteSingleCartService,
  deleteManyCartService,
};
