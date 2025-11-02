import { NextFunction, Request, Response } from "express";
import { productServices } from "./product.service";
import { deleteFileFromStorage } from "../../utils/deleteFilesFromStorage";

const createProductController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];

    const mainImage = files?.find(
      (file) => file.fieldname === "mainImage"
    )?.path;

    const images = files
      ?.filter((file) => file.fieldname.startsWith("images"))
      .map((file) => file.path);

    const video = files?.find((file) => file.fieldname === "video")?.path;

    const variants = [];
    if (req.body.variants) {
      const parsedVariants = Array.isArray(req.body.variants)
        ? req.body.variants
        : JSON.parse(req.body.variants);

      for (let index = 0; index < parsedVariants.length; index++) {
        const variant = parsedVariants[index];

        const variantImages = files
          .filter((file) =>
            file.fieldname.startsWith(`variants[${index}][images]`)
          )
          .map((file) => file.path);

        variants.push({
          ...variant,
          images: variantImages,
        });
      }
    }

    const productData = {
      ...req.body,
      ...(images.length && { images }),
      ...(mainImage && { mainImage }),
      ...(video && { video }),
      ...(variants.length && { variants }),
    };

    const result = await productServices.createProductService(productData);

    res.status(200).json({
      success: true,
      message: "Product Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const createProductByFileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filePath = req.file ? req.file.path : undefined;

    const result = await productServices.createProductByFileService(filePath);

    res.status(200).json({
      success: true,
      message: `${result.length} Product Created Successfully`,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllProductController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name"];

    const result = await productServices.getAllProductService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Products Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Product data
const getSingleProductController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const result = await productServices.getSingleProductService(productId);
    res.status(200).json({
      success: true,
      message: "Product Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleProductBySkuController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sku } = req.params;
    const result = await productServices.getSingleProductBySkuService(sku);
    res.status(200).json({
      success: true,
      message: "Product By SkU Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Get single Product data by slug
const getSingleProductBySlugController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productSlug } = req.params;
    const result = await productServices.getSingleProductBySlugService(
      productSlug
    );
    res.status(200).json({
      success: true,
      message: "Product Fetched by Slug Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Product controller
const updateSingleProductController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const data = req.body;
    const files = req.files as Express.Multer.File[];

    const mainImage = files.find(
      (file) => file.fieldname === "mainImage"
    )?.path;
    const uploadedImages = files
      .filter((file) => file.fieldname.startsWith("images"))
      .map((file) => file.path);
    const video = files.find((file) => file.fieldname === "video")?.path;

    const variants = [];
    if (data.variants) {
      const parsedVariants = Array.isArray(data.variants)
        ? data.variants
        : JSON.parse(data.variants);

      for (const [index, variant] of parsedVariants.entries()) {
        const parsedVariant =
          typeof variant === "string" ? JSON.parse(variant) : variant;

        const variantImages = files
          .filter((file) =>
            file.fieldname.startsWith(`variants[${index}][images]`)
          )
          .map((file) => file.path);

        const mergedVariantImages = [
          ...variantImages,
          ...(parsedVariant?.images && Array.isArray(parsedVariant.images)
            ? parsedVariant.images.filter(
                (image: string) => typeof image === "string"
              )
            : []),
        ];

        variants.push({
          ...parsedVariant,
          images: mergedVariantImages,
        });
      }
    }

    const existingProduct = await productServices.getSingleProductService(
      productId
    );

    const existingImages = Array.isArray(existingProduct.images)
      ? existingProduct.images
      : [];

    const stringImages = Array.isArray(data.images)
      ? data.images.filter((image: string) => typeof image === "string")
      : [];
    const imagesToKeep = [...stringImages, ...uploadedImages];
    const imagesToDelete = existingImages.filter(
      (image) => !imagesToKeep.includes(image)
    );

    for (const image of imagesToDelete) {
      await deleteFileFromStorage(image);
    }

    const productData = {
      ...data,
      images: imagesToKeep,
      ...(mainImage && { mainImage }),
      ...(video && { video }),
      ...(variants.length && { variants }),
    };

    const result = await productServices.updateSingleProductService(
      productId,
      productData
    );

    res.status(200).json({
      success: true,
      message: "Product Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in updateSingleProductController:", error);
    next(error);
  }
};

//Delete single Product controller
const deleteSingleProductController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    await productServices.deleteSingleProductService(productId);
    res.status(200).json({
      success: true,
      message: "Product Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Product controller
const deleteManyProductsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productIds = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Product IDs array provided",
        data: null,
      });
    }

    const result = await productServices.deleteManyProductsService(productIds);

    res.status(200).json({
      success: true,
      message: `Bulk Product Delete Successful! Deleted ${result.deletedCount} Products.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const productControllers = {
  createProductController,
  createProductByFileController,
  getAllProductController,
  getSingleProductController,
  getSingleProductBySkuController,
  getSingleProductBySlugController,
  updateSingleProductController,
  deleteSingleProductController,
  deleteManyProductsController,
};
