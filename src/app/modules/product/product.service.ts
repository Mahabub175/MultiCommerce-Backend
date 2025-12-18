import mongoose from "mongoose";
import config from "../../config";
import { deleteFileSync } from "../../utils/deleteFilesFromStorage";
import {
  findOrCreateBrand,
  findOrCreateCategory,
} from "../../utils/findOrCreateItems";
import { generateSlug } from "../../utils/generateSlug";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { parseExcel } from "../../utils/parseExcel";
import { postProcessProduct } from "../../utils/productUtils";
import { categoryModel } from "../category/category.model";
import { customRoleModel } from "../customRole/customRole.model";
import { IProduct } from "./product.interface";
import { productModel } from "./product.model";
import { cascadeCleanup } from "../../utils/cascadeCleanup";
import { cartModel } from "../cart/cart.model";
import { orderModel } from "../order/order.model";

const createProductService = async (productData: IProduct) => {
  productData.isVariant =
    productData.isVariant === "true" || productData.isVariant === true;

  const slug = productData.slug
    ? productData.slug
    : generateSlug(productData.name);

  const totalStock =
    productData.isVariant && Array.isArray(productData.variants)
      ? productData.variants.reduce(
          (sum, variant) => sum + (Number(variant.stock) || 0),
          0
        )
      : productData.stock || 0;

  const regularPrice = productData.regularPrice || 0;

  if (regularPrice <= 0) {
    throw new Error("Regular price must be greater than 0");
  }

  if (productData.salePrice !== undefined) {
    if (productData.salePrice >= regularPrice || productData.salePrice < 0) {
      throw new Error(
        "Sale price must be less than regular price and non-negative"
      );
    }
  }

  if (productData.isVariant) {
    if (
      !Array.isArray(productData.variants) ||
      productData.variants.length === 0
    ) {
      throw new Error("Variants must be provided for a variant product");
    }

    for (const variant of productData.variants) {
      if ((variant.regularPrice || 0) <= 0) {
        throw new Error(
          `Variant ${variant.sku} selling price must be greater than 0`
        );
      }
      if (
        variant.salePrice !== undefined &&
        (variant.salePrice >= variant.regularPrice! || variant.salePrice < 0)
      ) {
        throw new Error(
          `Variant ${variant.sku} offer price must be less than selling price and non-negative`
        );
      }
    }
  }

  if (productData.buyingPrice && productData.buyingPrice > regularPrice) {
    throw new Error("Buying price cannot exceed regular price");
  }

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

  const inputCategories = productData.category
    ? Array.isArray(productData.category)
      ? productData.category
      : [productData.category]
    : [];

  if (inputCategories.length) {
    const allCategories = await categoryModel
      .find()
      .select("_id parentCategory children status")
      .lean();

    const categoryMap = new Map<string, any>();
    allCategories.forEach((c) => categoryMap.set(c._id.toString(), c));

    const findImmediateParents = (childId: string): string[] => {
      const parents: string[] = [];

      const child = categoryMap.get(childId);
      if (!child) return parents;

      if (child.parentCategory) {
        parents.push(child.parentCategory.toString());
      }

      allCategories.forEach((cat) => {
        if (cat.children?.some((c: any) => c.toString() === childId)) {
          parents.push(cat._id.toString());
        }
      });

      return parents;
    };

    const resolvedCategories = new Set<string>();
    const stack = inputCategories.map(String);

    while (stack.length) {
      const currentId = stack.pop()!;
      if (resolvedCategories.has(currentId)) continue;

      const current = categoryMap.get(currentId);
      if (!current || current.status === false) continue;

      resolvedCategories.add(currentId);

      const parents = findImmediateParents(currentId);
      parents.forEach((pid) => {
        if (!resolvedCategories.has(pid)) {
          stack.push(pid);
        }
      });
    }

    productData.category = Array.from(resolvedCategories);
  }
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
        slug: generateSlug(product.name),
        category: category._id,
        brand: brand?._id ?? null,
        video: product.video || null,
        weight: product.weight || 0,
        unit: product.unit || null,
        productModel: product.productModel || null,
        buyingPrice: Number(product.buyingPrice),
        regularPrice: Number(product.regularPrice),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        stock: Number(product.stock),
        totalSold: 0,
        isVariant: false,
        isFeatured: product.isFeatured ?? false,
        isOnSale: product?.salePrice && Number(product.salePrice) > 0,
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
  currentUser?: any,
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[],
  filters?: {
    category?: string;
    priceRange?: { min?: number; max?: number };
    variant?: Record<string, any>;
    isOnSale?: boolean;
    isFeatured?: boolean;
    isVariant?: boolean;
    product?: string;
  }
) => {
  const isManagementRole = currentUser?.roleModel === "managementRole";
  const isCustomRole = currentUser?.roleModel === "customRole";

  const queryConditions: any = {};

  const {
    category,
    priceRange,
    variant = {},
    isOnSale,
    isFeatured,
  } = filters || {};

  if (category) {
    let categoryId = null;

    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryId = category;
    } else {
      const found = await categoryModel
        .findOne({ slug: category.trim() })
        .select("_id");

      categoryId = found ? found._id : null;
    }

    if (categoryId) {
      queryConditions.category = { $in: [categoryId] };
    } else {
      queryConditions.category = { $in: [] };
    }
  }

  if (typeof isOnSale === "boolean") queryConditions.isOnSale = isOnSale;
  if (typeof isFeatured === "boolean") queryConditions.isFeatured = isFeatured;

  if (filters?.product) {
    const p = filters.product.trim();
    const matchingCategories = await categoryModel.find(
      { $text: { $search: p } },
      { _id: 1 }
    );
    const productCategoryIds = matchingCategories.map((c) => c._id);

    queryConditions.$or = [
      ...(queryConditions.$or || []),
      { name: { $regex: p, $options: "i" } },
      { slug: p },
      ...(productCategoryIds.length
        ? [{ category: { $in: productCategoryIds } }]
        : []),
    ];
  }

  if (priceRange) {
    const { min, max } = priceRange;
    queryConditions.$or = [
      ...(min || max
        ? [
            {
              salePrice: {
                ...(min ? { $gte: min } : {}),
                ...(max ? { $lte: max } : {}),
              },
            },
          ]
        : []),
      ...(min || max
        ? [
            {
              regularPrice: {
                ...(min ? { $gte: min } : {}),
                ...(max ? { $lte: max } : {}),
              },
            },
          ]
        : []),
      ...(min || max
        ? [
            {
              "variants.salePrice": {
                ...(min ? { $gte: min } : {}),
                ...(max ? { $lte: max } : {}),
              },
            },
            {
              "variants.regularPrice": {
                ...(min ? { $gte: min } : {}),
                ...(max ? { $lte: max } : {}),
              },
            },
          ]
        : []),
    ];
  }

  if (Object.keys(variant).length > 0) {
    const variantConditions = Object.entries(variant).map(([key, value]) => ({
      attributeCombination: {
        $elemMatch: {
          attributeName: key.charAt(0).toUpperCase() + key.slice(1),
          optionName: value,
        },
      },
    }));
    queryConditions.variants = { $elemMatch: { $and: variantConditions } };
  }

  const query = productModel
    .find(queryConditions)
    .populate({
      path: "category",
      select:
        "-roleDiscounts -parentCategory -categories -subCategories -subSubCategories -children",
    })
    .populate("brand")
    .populate("reviews.user");

  if (currentUser) {
    if (isManagementRole) {
      query
        .populate("globalRoleDiscounts.role")
        .populate("productRoleDiscounts.role")
        .populate("categoryRoleDiscounts.role");
    } else if (isCustomRole) {
      query
        .populate({
          path: "globalRoleDiscounts.role",
          match: { name: currentUser.role },
        })
        .populate({
          path: "productRoleDiscounts.role",
          match: { name: currentUser.role },
        })
        .populate({
          path: "categoryRoleDiscounts.role",
          match: { name: currentUser.role },
        });
    }
  } else {
    query.select(
      "-globalRoleDiscounts -productRoleDiscounts -categoryRoleDiscounts"
    );
  }

  const executeQuery = async () => {
    if (page || limit || searchText) {
      const paginated = await paginateAndSort(
        query,
        page,
        limit,
        searchText,
        searchFields
      );
      paginated.results = paginated.results.map((product: any) =>
        postProcessProduct(product, isCustomRole)
      );
      return paginated;
    }

    const results = await query.lean().sort({ createdAt: -1 }).exec();
    const formattedResults = results.map((product: any) =>
      postProcessProduct(product, isCustomRole)
    );

    return { results: formattedResults };
  };

  return await executeQuery();
};

const getSingleProductService = async (
  currentUser: any,
  productId: string | number
) => {
  const queryId =
    typeof productId === "string"
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const isManagementRole = currentUser?.roleModel === "managementRole";
  const isCustomRole = currentUser?.roleModel === "customRole";

  const query = productModel
    .findById(queryId)
    .populate({
      path: "category",
      select:
        "-roleDiscounts -parentCategory -categories -subCategories -subSubCategories -children",
    })
    .populate("brand")
    .populate("reviews.user");

  if (isManagementRole) {
    query
      .populate("globalRoleDiscounts.role")
      .populate("productRoleDiscounts.role")
      .populate("categoryRoleDiscounts.role");
  } else if (isCustomRole) {
    query
      .populate({
        path: "globalRoleDiscounts.role",
        match: { name: currentUser.role },
      })
      .populate({
        path: "productRoleDiscounts.role",
        match: { name: currentUser.role },
      })
      .populate({
        path: "categoryRoleDiscounts.role",
        match: { name: currentUser.role },
      });
  }

  const result = await query.lean().exec();
  if (!result) throw new Error("Product not found");

  if (!currentUser) {
    result.globalRoleDiscounts = [];
    result.productRoleDiscounts = [];
    result.categoryRoleDiscounts = [];
  }

  const cleanedResult = postProcessProduct(result, isCustomRole);

  return cleanedResult;
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

const getSingleProductBySlugService = async (
  currentUser: any,
  productSlug: string
) => {
  const isManagementRole = currentUser?.roleModel === "managementRole";
  const isCustomRole = currentUser?.roleModel === "customRole";

  const query = productModel
    .findOne({ slug: productSlug })
    .populate({
      path: "category",
      select:
        "-roleDiscounts -parentCategory -categories -subCategories -subSubCategories -children",
    })
    .populate("brand")
    .populate("reviews.user");

  if (isManagementRole) {
    query
      .populate("globalRoleDiscounts.role")
      .populate("productRoleDiscounts.role")
      .populate("categoryRoleDiscounts.role");
  } else if (isCustomRole) {
    query
      .populate({
        path: "globalRoleDiscounts.role",
        match: { name: currentUser.role },
      })
      .populate({
        path: "productRoleDiscounts.role",
        match: { name: currentUser.role },
      })
      .populate({
        path: "categoryRoleDiscounts.role",
        match: { name: currentUser.role },
      });
  }

  const result = await query.lean().exec();
  if (!result) throw new Error("Product not found");

  if (!currentUser) {
    result.globalRoleDiscounts = [];
    result.productRoleDiscounts = [];
    result.categoryRoleDiscounts = [];
    result.categoryDiscounts = [];
  }

  const cleanedResult = postProcessProduct(result, isCustomRole);

  return cleanedResult;
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
    : generateSlug(productData.name);

  const regularPrice = productData.regularPrice || 0;
  if (regularPrice <= 0) {
    throw new Error("Regular price must be greater than 0");
  }

  if (productData.salePrice !== undefined) {
    if (productData.salePrice >= regularPrice || productData.salePrice < 0) {
      throw new Error(
        "Sale price must be less than regular price and non-negative"
      );
    }
  }

  if (productData.buyingPrice && productData.buyingPrice > regularPrice) {
    throw new Error("Buying price cannot exceed regular price");
  }

  let totalStock = productData.stock;
  if (productData.isVariant && Array.isArray(productData.variants)) {
    if (productData.variants.length === 0) {
      throw new Error("Variants must be provided for a variant product");
    }

    for (const variant of productData.variants) {
      if ((variant.regularPrice || 0) <= 0) {
        throw new Error(
          `Variant ${variant.sku} selling price must be greater than 0`
        );
      }
      if (
        variant.salePrice !== undefined &&
        (variant.salePrice >= variant.regularPrice! || variant.salePrice < 0)
      ) {
        throw new Error(
          `Variant ${variant.sku} offer price must be less than selling price and non-negative`
        );
      }
    }

    totalStock = productData.variants.reduce(
      (sum, variant) => sum + (Number(variant.stock) || 0),
      0
    );
  }

  let ratings = undefined;
  if (productData.reviews && productData.reviews.length > 0) {
    const totalRating = productData.reviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0
    );
    const count = productData.reviews.length;
    const average =
      count > 0 ? parseFloat((totalRating / count).toFixed(2)) : 0;
    ratings = { average, count };
  }

  const recalculateDiscounts = (discounts: any[] = []) => {
    return discounts.map((discount) => {
      if (!discount.discountType || !discount.discountValue) {
        return { ...discount, discountedPrice: undefined };
      }

      let discountedPrice = regularPrice;
      if (discount.discountType === "fixed") {
        discountedPrice = Math.max(0, regularPrice - discount.discountValue);
      } else if (discount.discountType === "percentage") {
        discountedPrice = Math.max(
          0,
          regularPrice - (regularPrice * discount.discountValue) / 100
        );
      }

      return { ...discount, discountedPrice };
    });
  };

  const dataToUpdate: Partial<IProduct> = {
    ...productData,
    slug,
    stock: totalStock,
    isVariant: productData.isVariant && Array.isArray(productData.variants),
    variants: productData.isVariant ? productData.variants : [],
    ratings,
    productRoleDiscounts: recalculateDiscounts(
      productData.productRoleDiscounts || []
    ),
    globalRoleDiscounts: recalculateDiscounts(
      productData.globalRoleDiscounts || []
    ),
    categoryRoleDiscounts: recalculateDiscounts(
      productData.categoryRoleDiscounts || []
    ),
    categoryDiscounts: recalculateDiscounts(
      productData.categoryDiscounts || []
    ),
  };

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

const deleteSingleProductService = async (productId: string | number) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    await cascadeCleanup(session, queryId, [
      { model: cartModel, fields: ["products.product"] },
      { model: orderModel, fields: ["items.product"] },
    ]);

    const result = await productModel.findByIdAndDelete(queryId).exec();

    if (!result) {
      throw new Error("Product delete failed");
    }

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteManyProductsService = async (productIds: (string | number)[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    for (const productId of queryIds) {
      await cascadeCleanup(session, productId, [
        { model: cartModel, fields: ["products.product"] },
        { model: orderModel, fields: ["items.product"] },
      ]);
    }

    const result = await productModel
      .deleteMany({ _id: { $in: queryIds } })
      .exec();

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
