import { orderModel } from "../modules/order/order.model";
import { productModel } from "../modules/product/product.model";
import { reserveOrderModel } from "../modules/reserveOrder/reserveOrder.model";
import { formatResultImage } from "./formatResultImage";
import cron from "node-cron";

const resolvePriceDetails = (product: any) => {
  const basePrice = product.regularPrice;
  if (!basePrice) {
    return {
      basePrice: null,
      finalPrice: null,
      discount: null,
    };
  }

  const calculateDiscount = (type: string, value: number) => {
    if (!value || value <= 0) return null;
    if (type === "fixed") return basePrice - value;
    if (type === "percentage") return basePrice - (basePrice * value) / 100;
    return null;
  };

  if (
  product.salePrice !== undefined &&
  product.salePrice !== null &&
  Number(product.salePrice) > 0 &&
  Number(product.salePrice) < basePrice
) {
  return {
    basePrice,
    finalPrice: product.salePrice,
    discount: {
      from: "sale",
      type: "fixed",
      discountValue: basePrice - product.salePrice,
      discountedPrice: product.salePrice,
    },
  };
}
  
  const pickRoleDiscount = (list: any[]) => {
    if (!Array.isArray(list)) return null;

    const valid = list
      .map((d) => {
        const discounted = calculateDiscount(d.discountType, d.discountValue);
        if (!discounted || discounted >= basePrice) return null;
        return { ...d, discountedPrice: discounted };
      })
      .filter(Boolean);

    return valid.length > 0 ? valid[0] : null;
  };

  const productRole = pickRoleDiscount(product.productRoleDiscounts);
  if (productRole) {
    return {
      basePrice,
      finalPrice: productRole.discountedPrice,
      discount: {
        from: "productRole",
        type: productRole.discountType,
        discountValue: productRole.discountValue,
        discountedPrice: productRole.discountedPrice,
      },
    };
  }

  const categoryRole = pickRoleDiscount(product.categoryRoleDiscounts);
  if (categoryRole) {
    return {
      basePrice,
      finalPrice: categoryRole.discountedPrice,
      discount: {
        from: "categoryRole",
        type: categoryRole.discountType,
        discountValue: categoryRole.discountValue,
        discountedPrice: categoryRole.discountedPrice,
      },
    };
  }

  const globalRole = pickRoleDiscount(product.globalRoleDiscounts);
  if (globalRole) {
    return {
      basePrice,
      finalPrice: globalRole.discountedPrice,
      discount: {
        from: "globalRole",
        type: globalRole.discountType,
        discountValue: globalRole.discountValue,
        discountedPrice: globalRole.discountedPrice,
      },
    };
  }

  return {
    basePrice,
    finalPrice: basePrice,
    discount: null,
  };
};

export const postProcessProduct = (product: any, isCustomRole: boolean) => {
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

    product.globalRoleDiscounts = cleanAndUniqueDiscounts(
      product.globalRoleDiscounts
    );
    product.productRoleDiscounts = cleanAndUniqueDiscounts(
      product.productRoleDiscounts
    );
    product.categoryRoleDiscounts = cleanAndUniqueDiscounts(
      product.categoryRoleDiscounts
    );
  }

  if (typeof product.mainImage === "string") {
    product.mainImage = formatResultImage(product.mainImage) as string;
  }

  if (typeof product.video === "string") {
    product.video = formatResultImage(product.video) as string;
  }

  if (Array.isArray(product.images)) {
    product.images = product.images.map((img: string) =>
      typeof img === "string" ? (formatResultImage(img) as string) : img
    );
  }

  if (Array.isArray(product.variants)) {
    product.variants = product.variants.map((variant: any) => {
      if (Array.isArray(variant.images)) {
        variant.images = variant.images.map((img: string) =>
          typeof img === "string" ? (formatResultImage(img) as string) : img
        );
      }
      return variant;
    });
  }

  product.priceDetails = resolvePriceDetails(product);

  if (isCustomRole) {
    delete product.globalRoleDiscounts;
    delete product.productRoleDiscounts;
    delete product.categoryRoleDiscounts;
    delete product.categoryDiscounts;
  }

  return product;
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
