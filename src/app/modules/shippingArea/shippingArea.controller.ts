import { NextFunction, Request, Response } from "express";
import { shippingAreaServices } from "./shippingArea.service";
import { IShippingArea } from "./shippingArea.interface";

const parseStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    // Try JSON first (e.g. '["a","b"]')
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      // fallthrough
    }
    // Fallback: comma-separated
    return trimmed.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
  return [String(value)].filter(Boolean);
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
};

const createShippingAreaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body as Record<string, unknown>;
    const data: IShippingArea = {
      areaName: String(body.areaName ?? ""),
      cities: parseStringArray(body.cities),
      zipCodes: parseStringArray(body.zipCodes),
      basePrice: toNumber(body.basePrice, 0),
      priceMultiplier: toNumber(body.priceMultiplier, 1),
      isDefault: toBoolean(body.isDefault, false),
      status: toBoolean(body.status, true),
    };

    const result = await shippingAreaServices.createShippingAreaService(data);

    res.status(200).json({
      success: true,
      message: "Shipping area created successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllShippingAreasController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;
    const searchFields = ["areaName", "cities", "zipCodes"];

    const result = await shippingAreaServices.getAllShippingAreasService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Shipping areas fetched successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleShippingAreaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { areaId } = req.params;
    const result = await shippingAreaServices.getSingleShippingAreaService(areaId);
    res.status(200).json({
      success: true,
      message: "Shipping area fetched successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getDefaultShippingAreaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await shippingAreaServices.getDefaultShippingAreaService();
    res.status(200).json({
      success: true,
      message: "Default shipping area fetched successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const findMatchingShippingAreaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { city, zipCode, country } = req.query;
    const result = await shippingAreaServices.findMatchingShippingAreaService(
      city as string,
      zipCode as string,
      country as string
    );
    res.status(200).json({
      success: true,
      message: "Matching shipping area found!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Returns the shipping cost for a given address:
 * - If address matches a specific area => use that area's basePrice * multiplier
 * - Else => use the default "other areas" basePrice * multiplier
 */
const getShippingAreaCostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { city, zipCode, country } = req.query;

    const matchedOrDefault = await shippingAreaServices.findMatchingShippingAreaService(
      city as string | undefined,
      zipCode as string | undefined,
      country as string | undefined
    );

    if (!matchedOrDefault) {
      return res.status(200).json({
        success: true,
        message: "No shipping area configured; using 0",
        data: {
          matched: false,
          isDefault: false,
          areaId: null,
          areaName: null,
          basePrice: 0,
          priceMultiplier: 1,
          cost: 0,
        },
      });
    }

    const basePrice = Number(matchedOrDefault.basePrice || 0);
    const priceMultiplier = Number(matchedOrDefault.priceMultiplier || 1);
    const cost = Math.max(0, basePrice * priceMultiplier);

    return res.status(200).json({
      success: true,
      message: matchedOrDefault.isDefault
        ? "Default (other areas) shipping cost returned"
        : "Matched area shipping cost returned",
      data: {
        matched: !matchedOrDefault.isDefault,
        isDefault: Boolean(matchedOrDefault.isDefault),
        areaId: matchedOrDefault._id ?? null,
        areaName: matchedOrDefault.areaName ?? null,
        basePrice,
        priceMultiplier,
        cost,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

const updateSingleShippingAreaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { areaId } = req.params;
    const body = req.body as Record<string, unknown>;
    const data: Partial<IShippingArea> = {
      ...(body.areaName !== undefined ? { areaName: String(body.areaName) } : {}),
      ...(body.cities !== undefined ? { cities: parseStringArray(body.cities) } : {}),
      ...(body.zipCodes !== undefined ? { zipCodes: parseStringArray(body.zipCodes) } : {}),
      ...(body.basePrice !== undefined ? { basePrice: toNumber(body.basePrice, 0) } : {}),
      ...(body.priceMultiplier !== undefined ? { priceMultiplier: toNumber(body.priceMultiplier, 1) } : {}),
      ...(body.isDefault !== undefined ? { isDefault: toBoolean(body.isDefault, false) } : {}),
      ...(body.status !== undefined ? { status: toBoolean(body.status, true) } : {}),
    };

    const result = await shippingAreaServices.updateSingleShippingAreaService(
      areaId,
      data
    );

    res.status(200).json({
      success: true,
      message: "Shipping area updated successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteSingleShippingAreaController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { areaId } = req.params;
    await shippingAreaServices.deleteSingleShippingAreaService(areaId);
    res.status(200).json({
      success: true,
      message: "Shipping area deleted successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteManyShippingAreasController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const areaIds = req.body;

    if (!Array.isArray(areaIds) || areaIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty area IDs array provided",
        data: null,
      });
    }

    const result = await shippingAreaServices.deleteManyShippingAreasService(areaIds);

    res.status(200).json({
      success: true,
      message: `Bulk shipping area delete successful! Deleted ${result.deletedCount} areas.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const shippingAreaControllers = {
  createShippingAreaController,
  getAllShippingAreasController,
  getSingleShippingAreaController,
  getDefaultShippingAreaController,
  findMatchingShippingAreaController,
  getShippingAreaCostController,
  updateSingleShippingAreaController,
  deleteSingleShippingAreaController,
  deleteManyShippingAreasController,
};
