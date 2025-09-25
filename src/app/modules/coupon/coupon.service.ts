import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { couponModel } from "./coupon.model";
import { ICoupon } from "./coupon.interface";
import moment from "moment";
import cron from "node-cron";

//Create a coupon into database
const createCouponService = async (couponData: ICoupon, filePath?: string) => {
  const dataToSave = { ...couponData, filePath };
  const result = await couponModel.create(dataToSave);
  return result;
};

// Get all coupon with optional pagination
const getAllCouponService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = couponModel.find().populate("user");

    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    result.results = formatResultImage<ICoupon>(
      result.results,
      "attachment"
    ) as ICoupon[];

    return result;
  } else {
    results = await couponModel
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

//Get single coupon
const getSingleCouponService = async (couponId: number | string) => {
  const queryId =
    typeof couponId === "string"
      ? new mongoose.Types.ObjectId(couponId)
      : couponId;

  const result = await couponModel.findById(queryId).populate("user").exec();

  if (!result) {
    throw new Error("Coupon not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<ICoupon>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

const getSingleCouponByCodeService = async (couponCode: string) => {
  const result = await couponModel
    .findOne({ code: couponCode })
    .populate("user")
    .exec();

  if (!result) {
    throw new Error("Coupon not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<ICoupon>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

//Update single coupon

const updateSingleCouponService = async (
  couponId: string | number,
  couponData: ICoupon
) => {
  const queryId =
    typeof couponId === "string"
      ? new mongoose.Types.ObjectId(couponId)
      : couponId;

  if (couponData.type === "percentage") {
    const amount = parseFloat(couponData.amount);
    if (isNaN(amount) || amount < 0 || amount > 100) {
      throw new Error("Amount must be a valid percentage between 0 and 100.");
    }
    couponData.amount = `${amount}%`;
  } else if (couponData.type === "fixed") {
    const fixedAmount = parseFloat(couponData.amount);
    if (isNaN(fixedAmount) || fixedAmount < 0) {
      throw new Error("Amount must be a valid number.");
    }
    couponData.amount = fixedAmount.toString();
  }

  const currentDate = moment();
  const expiredDate = moment(couponData.expiredDate).endOf("day");
  if (couponData.count > 0 && expiredDate.isAfter(currentDate)) {
    couponData.status = true;
  } else {
    couponData.status = false;
  }

  const result = await couponModel
    .findByIdAndUpdate(
      queryId,
      { $set: couponData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Coupon not found");
  }

  return result;
};

//Delete single coupon
const deleteSingleCouponService = async (couponId: string | number) => {
  const queryId =
    typeof couponId === "string"
      ? new mongoose.Types.ObjectId(couponId)
      : couponId;

  const result = await couponModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Coupon not found");
  }

  return result;
};

//Delete many coupon
const deleteManyCouponService = async (couponIds: (string | number)[]) => {
  const queryIds = couponIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const result = await couponModel
    .deleteMany({ _id: { $in: queryIds } })
    .exec();

  return result;
};

cron.schedule("0 0 * * *", async () => {
  try {
    const currentDate = moment();

    const coupons = await couponModel.find({ status: true });

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

export const couponServices = {
  createCouponService,
  getAllCouponService,
  getSingleCouponService,
  getSingleCouponByCodeService,
  updateSingleCouponService,
  deleteSingleCouponService,
  deleteManyCouponService,
};
