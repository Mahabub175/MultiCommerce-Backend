import { NextFunction, Request, Response } from "express";
import { giftCardServices } from "./giftCard.service";

const createGiftCardController = async (
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

    const result = await giftCardServices.createGiftCardService(formData);

    res.status(200).json({
      success: true,
      message: "Gift Card Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllGiftCardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name", "code"];

    const result = await giftCardServices.getAllGiftCardService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Gift Cards Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single GiftCard data
const getSingleGiftCardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { giftCardId } = req.params;
    const result = await giftCardServices.getSingleGiftCardService(giftCardId);
    res.status(200).json({
      success: true,
      message: "Gift Card Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleCouponByCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { giftCardCode } = req.params;
    const result = await giftCardServices.getSingleGiftCardByCodeService(
      giftCardCode
    );
    res.status(200).json({
      success: true,
      message: "Gift Card By Code Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single GiftCard controller
const updateSingleGiftCardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { giftCardId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const giftCardData = {
      ...data,
      attachment: filePath,
    };

    const result = await giftCardServices.updateSingleGiftCardService(
      giftCardId,
      giftCardData
    );

    res.status(200).json({
      success: true,
      message: "Gift Card Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single GiftCard controller
const deleteSingleGiftCardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { giftCardId } = req.params;
    await giftCardServices.deleteSingleGiftCardService(giftCardId);
    res.status(200).json({
      success: true,
      message: "Gift Card Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many GiftCard controller
const deleteManyGiftCardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const giftCardIds = req.body;

    if (!Array.isArray(giftCardIds) || giftCardIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty GiftCard IDs array provided",
        data: null,
      });
    }

    const result = await giftCardServices.deleteManyGiftCardService(
      giftCardIds
    );

    res.status(200).json({
      success: true,
      message: `Bulk Gift Card Delete Successful! Deleted ${result.deletedCount} Gift Card.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const giftCardControllers = {
  createGiftCardController,
  getAllGiftCardController,
  getSingleGiftCardController,
  getSingleCouponByCodeController,
  updateSingleGiftCardController,
  deleteSingleGiftCardController,
  deleteManyGiftCardController,
};
