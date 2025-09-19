import { NextFunction, Request, Response } from "express";
import { newsletterServices } from "./newsletter.service";

const createNewsletterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const formData = {
      ...data,
    };

    const result = await newsletterServices.createNewsletterService(formData);

    res.status(200).json({
      success: true,
      message: "Newsletter Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllNewsletterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["email"];

    const result = await newsletterServices.getAllNewsletterService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Newsletters Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Newsletter data
const getSingleNewsletterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newsletterId } = req.params;
    const result = await newsletterServices.getSingleNewsletterService(
      newsletterId
    );
    res.status(200).json({
      success: true,
      message: "Newsletter Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Newsletter controller
const updateSingleNewsletterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newsletterId } = req.params;
    const data = req.body;

    const newsletterData = {
      ...data,
    };

    const result = await newsletterServices.updateSingleNewsletterService(
      newsletterId,
      newsletterData
    );

    res.status(200).json({
      success: true,
      message: "Newsletter Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single Newsletter controller
const deleteSingleNewsletterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newsletterId } = req.params;
    await newsletterServices.deleteSingleNewsletterService(newsletterId);
    res.status(200).json({
      success: true,
      message: "Newsletter Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Newsletter controller
const deleteManyNewsletterController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newsletterIds = req.body;

    if (!Array.isArray(newsletterIds) || newsletterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Newsletter IDs array provided",
        data: null,
      });
    }

    const result = await newsletterServices.deleteManyNewsletterService(
      newsletterIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk Newsletter Delete Successful! Deleted ${result.deletedCount} Newsletter.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const newsletterControllers = {
  createNewsletterController,
  getAllNewsletterController,
  getSingleNewsletterController,
  updateSingleNewsletterController,
  deleteSingleNewsletterController,
  deleteManyNewsletterController,
};
