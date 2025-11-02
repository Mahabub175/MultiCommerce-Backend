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

  if (page || limit || searchText) {
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
export const updateSingleCouponService = async (
  couponId: string | number,
  couponData: Partial<ICoupon>
) => {
  const queryId =
    typeof couponId === "string"
      ? new mongoose.Types.ObjectId(couponId)
      : couponId;

  if (couponData.type === "percentage") {
    if (
      typeof couponData.amount !== "number" ||
      couponData.amount < 0 ||
      couponData.amount > 100
    ) {
      throw new Error("Amount must be a valid percentage between 0 and 100.");
    }
  } else if (couponData.type === "fixed") {
    if (typeof couponData.amount !== "number" || couponData.amount < 0) {
      throw new Error("Amount must be a valid number.");
    }
  }

  if (couponData.status === undefined) {
    const currentDate = moment();
    const expiredDate = moment(couponData.expiredDate).endOf("day");

    if (
      (couponData.count ?? 0) < (couponData.maxUsageCount ?? 1) &&
      expiredDate.isAfter(currentDate)
    ) {
      couponData.status = true;
    } else {
      couponData.status = false;
    }
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

const applyCouponService = async (
  userId: string,
  code: string,
  orderAmount: number
) => {
  const coupon = await couponModel.findOne({ code });
  if (!coupon) throw new Error("Invalid coupon code.");

  const validation = coupon.isValidForUser(userId, orderAmount);
  if (!validation.valid) throw new Error(validation.reason);

  const discount = coupon.calculateDiscount(orderAmount);
  const totalAfterDiscount = Math.max(orderAmount - discount, 0);

  await couponModel.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });

  return { discount, totalAfterDiscount };
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
  applyCouponService,
  deleteSingleCouponService,
  deleteManyCouponService,
};
