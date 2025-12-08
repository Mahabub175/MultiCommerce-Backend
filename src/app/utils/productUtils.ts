import { orderModel } from "../modules/order/order.model";
import { productModel } from "../modules/product/product.model";
import { reserveOrderModel } from "../modules/reserveOrder/reserveOrder.model";
import { formatResultImage } from "./formatResultImage";
import cron from "node-cron";
import bwipjs from "bwip-js";

export const resolvePriceDetails = (product: any) => {
  const basePrice = product.regularPrice;
  if (!basePrice) {
    return {
      basePrice: null,
      finalPrice: null,
      discount: null,
    };
  }

  const buildDiscountInfo = (
    from: string,
    type: string,
    discountValue: number,
    discountedPrice: number
  ) => {
    const discountAmount = basePrice - discountedPrice;
    const discountPercent = Math.round((discountAmount / basePrice) * 100);
    return {
      from,
      type,
      discountValue,
      discountAmount,
      discountPercent,
      discountedPrice,
    };
  };

  const calculateDiscount = (type: string, value: number) => {
    if (!value || value <= 0) return null;

    if (type === "fixed") {
      if (value >= basePrice) return null;
      return value;
    }

    if (type === "percentage") {
      const discounted = basePrice - (basePrice * value) / 100;
      if (discounted >= basePrice || discounted <= 0) return null;
      return discounted;
    }

    return null;
  };

  if (
    product.salePrice !== undefined &&
    product.salePrice !== null &&
    Number(product.salePrice) > 0 &&
    Number(product.salePrice) < basePrice
  ) {
    const salePrice = Number(product.salePrice);
    return {
      basePrice,
      finalPrice: salePrice,
      discount: buildDiscountInfo(
        "sale",
        "fixed",
        basePrice - salePrice,
        salePrice
      ),
    };
  }

  const pickRoleDiscount = (list: any[]) => {
    if (!Array.isArray(list)) return null;

    const valid = list
      .map((d) => {
        const discountedPrice = calculateDiscount(
          d.discountType,
          d.discountValue
        );
        if (!discountedPrice || discountedPrice >= basePrice) return null;

        return { ...d, discountedPrice };
      })
      .filter(Boolean);

    return valid.length > 0 ? valid[0] : null;
  };

  const productRole = pickRoleDiscount(product.productRoleDiscounts);
  if (productRole) {
    return {
      basePrice,
      finalPrice: productRole.discountedPrice,
      discount: buildDiscountInfo(
        "productRole",
        productRole.discountType,
        productRole.discountValue,
        productRole.discountedPrice
      ),
    };
  }

  const categoryRole = pickRoleDiscount(product.categoryRoleDiscounts);
  if (categoryRole) {
    return {
      basePrice,
      finalPrice: categoryRole.discountedPrice,
      discount: buildDiscountInfo(
        "categoryRole",
        categoryRole.discountType,
        categoryRole.discountValue,
        categoryRole.discountedPrice
      ),
    };
  }

  const globalRole = pickRoleDiscount(product.globalRoleDiscounts);
  if (globalRole) {
    return {
      basePrice,
      finalPrice: globalRole.discountedPrice,
      discount: buildDiscountInfo(
        "globalRole",
        globalRole.discountType,
        globalRole.discountValue,
        globalRole.discountedPrice
      ),
    };
  }

  return {
    basePrice,
    finalPrice: basePrice,
    discount: null,
  };
};

export const postProcessProduct = (product: any, isCustomRole?: boolean) => {
  const plainProduct = product.toObject ? product.toObject() : { ...product };

  if (isCustomRole) {
    const cleanAndUniqueDiscounts = (discounts: any[]) => {
      if (!Array.isArray(discounts)) return discounts;
      const valid = discounts.filter((d) => d?.role);
      const unique = valid.filter(
        (d, i, arr) =>
          arr.findIndex(
            (t) => t?.role?._id?.toString?.() === d?.role?._id?.toString?.()
          ) === i
      );
      return unique;
    };

    plainProduct.globalRoleDiscounts = cleanAndUniqueDiscounts(
      plainProduct.globalRoleDiscounts
    );
    plainProduct.productRoleDiscounts = cleanAndUniqueDiscounts(
      plainProduct.productRoleDiscounts
    );
    plainProduct.categoryRoleDiscounts = cleanAndUniqueDiscounts(
      plainProduct.categoryRoleDiscounts
    );
  }

  if (typeof plainProduct.mainImage === "string") {
    plainProduct.mainImage = formatResultImage(
      plainProduct.mainImage
    ) as string;
  }
  if (typeof plainProduct.barcodeImage === "string") {
    plainProduct.barcodeImage = formatResultImage(
      plainProduct.barcodeImage
    ) as string;
  }

  if (typeof plainProduct.video === "string") {
    plainProduct.video = formatResultImage(plainProduct.video) as string;
  }

  if (Array.isArray(plainProduct.images)) {
    plainProduct.images = plainProduct.images.map((img: string) =>
      typeof img === "string" ? (formatResultImage(img) as string) : img
    );
  }

  if (Array.isArray(plainProduct.variants)) {
    plainProduct.variants = plainProduct.variants.map((variant: any) => {
      if (Array.isArray(variant.images)) {
        variant.images = variant.images.map((img: string) =>
          typeof img === "string" ? (formatResultImage(img) as string) : img
        );
      }
      return variant;
    });
  }

  plainProduct.priceDetails = resolvePriceDetails(plainProduct);

  if (isCustomRole) {
    delete plainProduct.globalRoleDiscounts;
    delete plainProduct.productRoleDiscounts;
    delete plainProduct.categoryRoleDiscounts;
    delete plainProduct.categoryDiscounts;
  }

  return plainProduct;
};

export const restoreProductStock = async (sku: string, quantity = 1) => {
  const product =
    (await productModel.findOne({ "variants.sku": sku })) ||
    (await productModel.findOne({ sku }));

  if (!product) return;

  const variant = product.variants?.find((v) => v.sku === sku);
  if (variant) {
    variant.stock += quantity;
  } else if (product.sku === sku) {
    product.stock += quantity;
  }

  product.stock = product.variants?.length
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : product.stock;

  await product.save();
};

cron.schedule("0 2 * * *", async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const expiredOrders = await reserveOrderModel.find({
      createdAt: { $lte: threeDaysAgo },
    });

    for (const order of expiredOrders) {
      for (const item of order.products) {
        await restoreProductStock(item.sku, item.quantity);
      }
      await reserveOrderModel.findByIdAndDelete(order._id);
    }
  } catch (err) {}
});

cron.schedule("0 2 * * *", async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const expiredOrders = await orderModel.find({
      shippingMethod: "reserve_order",
      createdAt: { $lte: threeDaysAgo },
    });

    for (const order of expiredOrders) {
      for (const item of order.items) {
        await restoreProductStock(item.sku, item.quantity);
      }

      await orderModel.findByIdAndDelete(order._id);
    }
  } catch (err) {}
});

export const processCart = (cart: any, isCustomRole: boolean) => {
  if (!cart || !Array.isArray(cart.products)) return cart;

  cart.products = cart.products.map((p: any) => {
    if (p.product) {
      const processed = postProcessProduct(p.product, isCustomRole);
      const { priceDetails, ...rest } = processed;

      p.product = rest;
      p.priceDetails = priceDetails;
    }
    return p;
  });

  let totalBase = 0;
  let totalFinal = 0;
  let totalDiscountAmount = 0;

  cart.products.forEach((p: any) => {
    const qty = p.quantity || 1;

    const base = p.priceDetails?.basePrice ? p.priceDetails.basePrice * qty : 0;
    const final = p.priceDetails?.finalPrice
      ? p.priceDetails.finalPrice * qty
      : 0;
    const discount = p.priceDetails?.discount?.discountValue
      ? p.priceDetails.discount.discountValue * qty
      : 0;

    totalBase += base;
    totalFinal += final;
    totalDiscountAmount += discount;
  });

  cart.totalAmount = totalFinal;
  cart.totalQuantity = cart.products.reduce(
    (sum: number, p: any) => sum + (p.quantity || 0),
    0
  );
  cart.totalWeight = cart.products.reduce(
    (sum: number, p: any) => sum + (p.weight || 0),
    0
  );

  cart.totalDiscountAmount = totalDiscountAmount;
  cart.totalDiscountPercent =
    totalBase > 0 ? Math.round((totalDiscountAmount / totalBase) * 100) : 0;

  return cart;
};

export const generateBarcode = async (text: string) => {
  return bwipjs.toBuffer({
    bcid: "code128",
    text,
    scale: 3,
    height: 10,
    includetext: true,
  });
};
