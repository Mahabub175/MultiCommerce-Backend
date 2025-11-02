import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { IProduct } from "./product.interface";
import { productModel } from "./product.model";
import { productSlug } from "../../utils/generateSlug";
import { parseExcel } from "../../utils/parseExcel";
import config from "../../config";
import {
  findOrCreateBrand,
  findOrCreateCategory,
} from "../../utils/findOrCreateItems";
import { deleteFileSync } from "../../utils/deleteFilesFromStorage";
import { customRoleModel } from "../customRole/customRole.model";

const createProductService = async (productData: IProduct) => {
  const slug = productData.slug
    ? productData.slug
    : productSlug(productData.name, productData.sku);

  const totalStock =
    productData.isVariant && Array.isArray(productData.variants)
      ? productData.variants.reduce(
          (sum, variant) => sum + (Number(variant.stock) || 0),
          0
        )
      : productData.stock || 0;

  const activeRoles = await customRoleModel.find({ status: true });

  const existingProductRoleIds = new Set(
    (productData.productRoleDiscounts || []).map((r) => r.role.toString())
  );
  const existingGlobalRoleIds = new Set(
    (productData.globalRoleDiscounts || []).map((r) => r.role.toString())
  );

  const newRoleDiscounts = activeRoles.map((role) => ({
    role: role._id,
    discountType: role.discountType,
    discountValue: role.discountValue,
    minimumQuantity: role.minimumQuantity || 1,
  }));

  const filteredProductRoleDiscounts = newRoleDiscounts.filter(
    (discount) => !existingProductRoleIds.has(discount.role.toString())
  );
  const filteredGlobalRoleDiscounts = newRoleDiscounts.filter(
    (discount) => !existingGlobalRoleIds.has(discount.role.toString())
  );

  const dataToSave: any = {
    ...productData,
    slug,
    stock: totalStock,
    productRoleDiscounts: [
      ...(productData.productRoleDiscounts || []),
      ...filteredProductRoleDiscounts,
    ],
    globalRoleDiscounts: [
      ...(productData.globalRoleDiscounts || []),
      ...filteredGlobalRoleDiscounts,
    ],
  };

  const newProduct = await productModel.create(dataToSave);

  return newProduct;
};

const createProductByFileService = async (filePath?: any) => {
  const products = (await parseExcel(filePath)) as any[];

  const processedProducts = await Promise.all(
    products.map(async (product: any) => {
      const category = await findOrCreateCategory(product.category);

      const brand = product.brand
        ? await findOrCreateBrand(product.brand)
        : null;

      let imageFileUrl = null;
      if (product.image) {
        const formData = new FormData();
        formData.append("image", product.image);

        try {
          const response = await fetch(`${config.base_url}/api/v1/upload/`, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (data.success) {
            imageFileUrl = data.file.url;
          } else {
            console.error("Image upload failed:", data.message);
          }
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }

      return {
        name: product.name,
        sku: product.sku,
        slug: productSlug(product.name, product.sku),
        category: category._id,
        brand: brand?._id ?? null,
        video: product.video || null,
        weight: product.weight || 0,
        unit: product.unit || null,
        productModel: product.productModel || null,
        buyingPrice: Number(product.buyingPrice),
        sellingPrice: Number(product.sellingPrice),
        offerPrice: product.offerPrice ? Number(product.offerPrice) : null,
        stock: Number(product.stock),
        totalSold: 0,
        isVariant: false,
        isFeatured: product.isFeatured ?? false,
        isOnSale: product?.offerPrice && Number(product.offerPrice) > 0,
        isAvailable: true,
        isBestSeller: false,
        isTopRated: false,
        isRecent: true,
        description: product.description || "",
        mainImage: imageFileUrl ? imageFileUrl : null,
      };
    })
  );

  return await productModel.insertMany(processedProducts);
};

const getAllProductService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  if (page || limit || searchText) {
    const query = productModel
      .find()
      .populate("category")
      .populate("brand")
      .populate("reviews.user")
      .populate("globalRoleDiscounts.role")
      .populate("productRoleDiscounts.role")
      .populate("categoryRoleDiscounts.role");

    return await paginateAndSort(query, page, limit, searchText, searchFields);
  } else {
    const results = await productModel
      .find()
      .populate("category")
      .populate("brand")
      .populate("reviews.user")
      .populate("globalRoleDiscounts.role")
      .populate("productRoleDiscounts.role")
      .populate("categoryRoleDiscounts.role")
      .lean()
      .sort({ createdAt: -1 })
      .exec();

    return { results };
  }
};

const getSingleProductService = async (productId: number | string) => {
  const queryId =
    typeof productId === "string"
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const result = await productModel
    .findById(queryId)
    .populate("category")
    .populate("brand")
    .populate("reviews.user")
    .populate("globalRoleDiscounts.role")
    .populate("productRoleDiscounts.role")
    .populate("categoryRoleDiscounts.role")
    .lean()
    .exec();

  if (!result) {
    throw new Error("Product not found");
  }

  if (typeof result.mainImage === "string") {
    const formattedAttachment = formatResultImage<IProduct>(result.mainImage);
    if (typeof formattedAttachment === "string") {
      result.mainImage = formattedAttachment;
    }
  }

  return result;
};

const getSingleProductBySkuService = async (sku: string | number) => {
  const result = await productModel
    .findOne({ $or: [{ sku }, { "variants.sku": sku }] })
    .select("name _id variants sku")
    .exec();

  if (!result) {
    throw new Error("Product not found");
  }

  if (!result.variants) {
    throw new Error("Variants not found for the product");
  }

  let matchingVariant = null;

  if (result.sku === sku) {
    if (result.variants.length > 0) {
      matchingVariant = result.variants[0];
    }
  } else {
    matchingVariant = result.variants.find((variant) => variant.sku === sku);
  }

  return {
    productId: result._id,
    productName: result.name,
    sku: matchingVariant?.sku ?? result.sku,
    variant: matchingVariant || null,
  };
};

const getSingleProductBySlugService = async (productSlug: string) => {
  const result = await productModel
    .findOne({ slug: productSlug })
    .populate("category")
    .populate("brand")
    .populate("reviews.user")
    .populate("globalRoleDiscounts.role")
    .populate("productRoleDiscounts.role")
    .populate("categoryRoleDiscounts.role")
    .lean()
    .exec();

  if (!result) {
    throw new Error("Product not found");
  }

  return result;
};

const updateSingleProductService = async (
  productId: string | number,
  productData: IProduct
) => {
  const queryId =
    typeof productId === "string"
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const slug = productData?.slug
    ? productData.slug
    : productSlug(productData.name, productData.sku);

  let totalStock = productData.stock;

  const dataToUpdate: Partial<IProduct> = {
    ...productData,
    slug,
  };

  if (
    productData.isVariant &&
    Array.isArray(productData.variants) &&
    productData.variants.length > 0
  ) {
    totalStock = productData.variants.reduce(
      (sum, variant) => sum + (Number(variant.stock) || 0),
      0
    );
    dataToUpdate.stock = totalStock;
  } else {
    dataToUpdate.isVariant = false;
    dataToUpdate.variants = [];
    dataToUpdate.stock = productData.stock;
  }

  if (productData.reviews && productData.reviews.length > 0) {
    const totalRating = productData.reviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0
    );
    const count = productData.reviews.length;
    const average =
      count > 0 ? parseFloat((totalRating / count).toFixed(2)) : 0;

    dataToUpdate.ratings = {
      average,
      count,
    };
  }

  if (
    productData.productRoleDiscounts &&
    productData.productRoleDiscounts.length > 0
  ) {
    const updatedRoleDiscounts = productData.productRoleDiscounts.map(
      (discount) => {
        let discountedPrice = productData.sellingPrice;

        if (discount.discountType === "fixed") {
          discountedPrice = Math.max(
            0,
            productData.sellingPrice - discount.discountValue
          );
        } else if (discount.discountType === "percentage") {
          discountedPrice = Math.max(
            0,
            productData.sellingPrice -
              (productData.sellingPrice * discount.discountValue) / 100
          );
        }

        return {
          ...discount,
          discountedPrice,
        };
      }
    );

    dataToUpdate.productRoleDiscounts = updatedRoleDiscounts;
  }

  const result = await productModel
    .findByIdAndUpdate(
      queryId,
      { $set: dataToUpdate },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Product not found");
  }

  return result;
};

export const deleteSingleProductService = async (
  productId: string | number
) => {
  const queryId =
    typeof productId === "string"
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const product = await productModel.findById(queryId).exec();

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.mainImage) {
    deleteFileSync(product.mainImage);
  }

  if (product.video) {
    deleteFileSync(product.video);
  }

  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      deleteFileSync(image);
    }
  }

  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      if (variant.images && variant.images.length > 0) {
        for (const image of variant.images) {
          deleteFileSync(image);
        }
      }
    }
  }

  if (product.reviews && product.reviews.length > 0) {
    for (const review of product.reviews) {
      if (review.attachment && review.attachment.length > 0) {
        for (const attachment of review.attachment) {
          deleteFileSync(attachment);
        }
      }
    }
  }

  const result = await productModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Product delete failed");
  }

  return result;
};

export const deleteManyProductsService = async (
  productIds: (string | number)[]
) => {
  const queryIds = productIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const products = await productModel.find({ _id: { $in: queryIds } }).exec();

  for (const product of products) {
    if (product.mainImage) {
      deleteFileSync(product.mainImage);
    }

    if (product.video) {
      deleteFileSync(product.video);
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        deleteFileSync(image);
      }
    }

    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.images && variant.images.length > 0) {
          for (const image of variant.images) {
            deleteFileSync(image);
          }
        }
      }
    }

    if (product.reviews && product.reviews.length > 0) {
      for (const review of product.reviews) {
        if (review.attachment && review.attachment.length > 0) {
          for (const attachment of review.attachment) {
            deleteFileSync(attachment);
          }
        }
      }
    }
  }

  const result = await productModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

export const productServices = {
  createProductService,
  createProductByFileService,
  getAllProductService,
  getSingleProductService,
  getSingleProductBySkuService,
  getSingleProductBySlugService,
  updateSingleProductService,
  deleteSingleProductService,
  deleteManyProductsService,
};
