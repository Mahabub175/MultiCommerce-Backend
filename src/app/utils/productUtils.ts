import { productModel } from "../modules/product/product.model";
import { reserveOrderModel } from "../modules/reserveOrder/reserveOrder.model";
import { formatResultImage } from "./formatResultImage";
import cron from "node-cron";

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

  return product;
};

export const restoreProductStock = async (sku: string) => {
  const product =
    (await productModel.findOne({ "variants.sku": sku })) ||
    (await productModel.findOne({ sku }));

  if (!product) return;

  const variant = product.variants?.find((v) => v.sku === sku);
  if (variant) {
    variant.stock += 1;
  } else if (product.sku === sku) {
    product.stock += 1;
  }

  product.stock = product.variants?.length
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : product.stock;

  await product.save();
};

cron.schedule("0 2 * * *", async () => {
  try {
    console.log("Running Reserve Order Cleanup Job...");

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const expiredOrders = await reserveOrderModel.find({
      createdAt: { $lte: threeDaysAgo },
    });

    for (const order of expiredOrders) {
      await restoreProductStock(order.sku);
      await reserveOrderModel.findByIdAndDelete(order._id);
    }
  } catch (err) {}
});
