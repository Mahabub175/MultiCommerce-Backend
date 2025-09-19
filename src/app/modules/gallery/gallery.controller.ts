import { NextFunction, Request, Response } from "express";
import { galleryServices } from "./gallery.service";

const createGalleryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await galleryServices.createGalleryService(formData);

    res.status(200).json({
      success: true,
      message: "Gallery Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllGalleryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name"];

    const result = await galleryServices.getAllGalleryService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Galleries Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single gallery data
const getSingleGalleryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { galleryId } = req.params;
    const result = await galleryServices.getSingleGalleryService(galleryId);
    res.status(200).json({
      success: true,
      message: "Gallery Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single gallery controller
const updateSingleGalleryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { galleryId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const galleryData = {
      ...data,
      attachment: filePath,
    };

    const result = await galleryServices.updateSingleGalleryService(
      galleryId,
      galleryData
    );

    res.status(200).json({
      success: true,
      message: "Gallery Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single gallery controller
const deleteSingleGalleryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { galleryId } = req.params;
    await galleryServices.deleteSingleGalleryService(galleryId);
    res.status(200).json({
      success: true,
      message: "Gallery Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many gallery controller
const deleteManyGalleryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const galleryIds = req.body;

    if (!Array.isArray(galleryIds) || galleryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty gallery IDs array provided",
        data: null,
      });
    }

    const result = await galleryServices.deleteManyGalleryService(galleryIds);

    res.status(200).json({
      success: true,
      message: `Bulk gallery Delete Successful! Deleted ${result.deletedCount} galleries.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const galleryControllers = {
  createGalleryController,
  getAllGalleryController,
  getSingleGalleryController,
  updateSingleGalleryController,
  deleteSingleGalleryController,
  deleteManyGalleryController,
};
