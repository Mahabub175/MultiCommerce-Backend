import { NextFunction, Request, Response } from "express";
import { courierServices } from "./courier.service";

const parseShippingSlots = (data: any) => {
  if (!data.shippingSlots) return data;

  const parsedSlots = Array.isArray(data.shippingSlots)
    ? data.shippingSlots
    : Object.keys(data)
        .filter((key) => key.startsWith("shippingSlots["))
        .reduce((acc: any[], key) => {
          const match = key.match(/shippingSlots\[(\d+)\]\[(.+)\]/);
          if (match) {
            const index = parseInt(match[1]);
            const field = match[2];
            if (!acc[index]) acc[index] = {};
            acc[index][field] = data[key];
          }
          return acc;
        }, []);

  const processedSlots = parsedSlots.map((slot: any) => {
    const processed: any = { ...slot };

    // Convert string booleans to actual booleans
    if (processed.status === "true" || processed.status === true) {
      processed.status = true;
    } else if (processed.status === "false" || processed.status === false) {
      processed.status = false;
    }

    if (processed.useDimensionalWeight === "true" || processed.useDimensionalWeight === true) {
      processed.useDimensionalWeight = true;
    } else if (processed.useDimensionalWeight === "false" || processed.useDimensionalWeight === false) {
      processed.useDimensionalWeight = false;
    }

    // Convert numeric strings to numbers
    if (processed.basePrice) processed.basePrice = Number(processed.basePrice);
    if (processed.perKmPrice) processed.perKmPrice = Number(processed.perKmPrice);
    if (processed.additionalPricePerKm) processed.additionalPricePerKm = Number(processed.additionalPricePerKm);
    if (processed.maxOrders) processed.maxOrders = Number(processed.maxOrders);
    if (processed.estimatedDeliveryTime) processed.estimatedDeliveryTime = Number(processed.estimatedDeliveryTime);
    if (processed.weightMultiplier) processed.weightMultiplier = Number(processed.weightMultiplier);
    if (processed.dimensionMultiplier) processed.dimensionMultiplier = Number(processed.dimensionMultiplier);
    if (processed.dimensionalWeightDivisor) processed.dimensionalWeightDivisor = Number(processed.dimensionalWeightDivisor);

    return processed;
  });

  return {
    ...data,
    shippingSlots: processedSlots,
  };
};

const createCourierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = parseShippingSlots(req.body);
    const filePath = req.file ? req.file.path : undefined;
    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await courierServices.createCourierService(formData);
    res.status(200).json({
      success: true,
      message: "Courier Created Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllCouriersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = page ? parseInt(page as string, 1) : undefined;
    const pageSize = limit ? parseInt(limit as string, 100) : undefined;
    const searchText = req.query.searchText as string | undefined;
    const searchFields = ["slotName", "status"];
    const result = await courierServices.getAllCouriersService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );
    res.status(200).json({
      success: true,
      message: "Couriers Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleCourierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    const result = await courierServices.getSingleCourierService(slotId);
    res.status(200).json({
      success: true,
      message: "Courier Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateCourierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    const data = parseShippingSlots(req.body);

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await courierServices.updateCourierService(slotId, formData);
    res.status(200).json({
      success: true,
      message: "Courier Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteSingleCourierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = req.params;
    await courierServices.deleteSingleCourierService(slotId);
    res.status(200).json({
      success: true,
      message: "Courier Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteManyCouriersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slotIds = req.body;
    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Slot IDs array provided",
        data: null,
      });
    }
    const result = await courierServices.deleteManyCourierService(slotIds);
    res.status(200).json({
      success: true,
      message: `Bulk Courier Delete Successful! Deleted ${result.deletedCount} slots.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const calculateShippingCostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const result = await courierServices.calculateShippingCostService(data);
    res.status(200).json({
      success: true,
      message: "Shipping cost calculated successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const courierControllers = {
  createCourierController,
  getAllCouriersController,
  getSingleCourierController,
  updateCourierController,
  deleteSingleCourierController,
  deleteManyCouriersController,
  calculateShippingCostController,
};
