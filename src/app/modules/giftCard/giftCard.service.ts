import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { IGiftCard } from "./giftCard.interface";
import { giftCardModel } from "./giftCard.model";
import moment from "moment";
import cron from "node-cron";

//Create a GiftCard into database
const createGiftCardService = async (
  giftCardData: IGiftCard,
  filePath?: string
) => {
  const dataToSave = { ...giftCardData, filePath };
  const result = await giftCardModel.create(dataToSave);
  return result;
};

// Get all GiftCard with optional pagination
const getAllGiftCardService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = giftCardModel.find().populate("user");

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    result.results = formatResultImage<IGiftCard>(
      result.results,
      "attachment"
    ) as IGiftCard[];

    return result;
  } else {
    results = await giftCardModel
      .find()
      .populate("user")
      .sort({ createdAt: -1 })
      .exec();

    results = formatResultImage(results, "attachment");

    return {
      results,
    };
  }
};

//Get single GiftCard
const getSingleGiftCardService = async (giftCardId: number | string) => {
  const queryId =
    typeof giftCardId === "string"
      ? new mongoose.Types.ObjectId(giftCardId)
      : giftCardId;

  const result = await giftCardModel.findById(queryId).populate("user").exec();

  if (!result) {
    throw new Error("Gift Card not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<IGiftCard>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

const getSingleGiftCardByCodeService = async (giftCardCode: string) => {
  const result = await giftCardModel
    .findOne({ code: giftCardCode })
    .populate("user")
    .exec();

  if (!result) {
    throw new Error("Coupon not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<IGiftCard>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

//Update single GiftCard
const updateSingleGiftCardService = async (
  giftCardId: string | number,
  giftCardData: IGiftCard
) => {
  const queryId =
    typeof giftCardId === "string"
      ? new mongoose.Types.ObjectId(giftCardId)
      : giftCardId;

  const currentDate = moment();
  const expiredDate = moment(giftCardData.expiredDate).endOf("day");
  if (expiredDate.isAfter(currentDate)) {
    giftCardData.status = true;
  } else {
    giftCardData.status = false;
  }

  const result = await giftCardModel
    .findByIdAndUpdate(
      queryId,
      { $set: giftCardData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Gift Card not found");
  }

  return result;
};

const applyGiftCardService = async (
  userId: string,
  code: string,
  orderAmount: number
) => {
  const giftCard = await giftCardModel.findOne({ code });
  if (!giftCard) throw new Error("Invalid gift card code.");

  const validation = giftCard.isValidForUser(userId);
  if (!validation.valid) throw new Error(validation.reason);

  const discount = Math.min(orderAmount, giftCard.amount);
  const totalAfterDiscount = orderAmount - discount;

  await giftCard.incrementUsage();

  return { discount, totalAfterDiscount };
};

//Delete single GiftCard
const deleteSingleGiftCardService = async (giftCardId: string | number) => {
  const queryId =
    typeof giftCardId === "string"
      ? new mongoose.Types.ObjectId(giftCardId)
      : giftCardId;

  const result = await giftCardModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Gift Card not found");
  }

  return result;
};

//Delete many GiftCard
const deleteManyGiftCardService = async (giftCardIds: (string | number)[]) => {
  const queryIds = giftCardIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await giftCardModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

cron.schedule("0 0 * * *", async () => {
  try {
    const currentDate = moment();

    const coupons = await giftCardModel.find({ status: true });

    for (const coupon of coupons) {
      const expiredDate = moment(coupon.expiredDate).endOf("day");

      if (expiredDate.isBefore(currentDate) || coupon.count <= 0) {
        coupon.status = false;
        await coupon.save();
      }
    }
  } catch (error) {
    console.error("Error running coupon expiration check:", error);
  }
});

export const giftCardServices = {
  createGiftCardService,
  getAllGiftCardService,
  getSingleGiftCardService,
  applyGiftCardService,
  getSingleGiftCardByCodeService,
  updateSingleGiftCardService,
  deleteSingleGiftCardService,
  deleteManyGiftCardService,
};
