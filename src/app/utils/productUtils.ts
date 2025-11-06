import { formatResultImage } from "./formatResultImage";

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

  if (Array.isArray(product.images)) {
    product.images = product.images.map((img: string) =>
      typeof img === "string" ? (formatResultImage(img) as string) : img
    );
  }

  return product;
};
