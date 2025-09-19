import { NextFunction, Request, Response } from "express";
import { sliderServices } from "./slider.service";

const createSliderController = async (
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

    const result = await sliderServices.createSliderService(formData);

    res.status(200).json({
      success: true,
      message: "Slider Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllSliderController = async (
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

    const result = await sliderServices.getAllSliderService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Sliders Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single slider data
const getSingleSliderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sliderId } = req.params;
    const result = await sliderServices.getSingleSliderService(sliderId);
    res.status(200).json({
      success: true,
      message: "Slider Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single slider controller
const updateSingleSliderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sliderId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const sliderData = {
      ...data,
      attachment: filePath,
    };

    const result = await sliderServices.updateSingleSliderService(
      sliderId,
      sliderData
    );

    res.status(200).json({
      success: true,
      message: "Slider Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single slider controller
const deleteSingleSliderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sliderId } = req.params;
    await sliderServices.deleteSingleSliderService(sliderId);
    res.status(200).json({
      success: true,
      message: "Slider Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many slider controller
const deleteManySlidersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sliderIds = req.body;

    if (!Array.isArray(sliderIds) || sliderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty slider IDs array provided",
        data: null,
      });
    }

    const result = await sliderServices.deleteManySlidersService(sliderIds);

    res.status(200).json({
      success: true,
      message: `Bulk slider Delete Successful! Deleted ${result.deletedCount} sliders.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const sliderControllers = {
  createSliderController,
  getAllSliderController,
  getSingleSliderController,
  updateSingleSliderController,
  deleteSingleSliderController,
  deleteManySlidersController,
};
