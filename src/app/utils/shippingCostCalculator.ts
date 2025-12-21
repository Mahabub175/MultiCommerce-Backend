import { ICourier } from "../modules/courier/courier.interface";
import { IShippingArea } from "../modules/shippingArea/shippingArea.interface";
import { shippingAreaServices } from "../modules/shippingArea/shippingArea.service";

export interface IShippingCalculationInput {
  slotId: string;
  courier: ICourier;
  items: Array<{
    weight?: number; // in grams
    length?: number; // in cm
    width?: number; // in cm
    height?: number; // in cm
    quantity: number;
  }>;
  shippingAddress: {
    city?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface IShippingCalculationResult {
  basePrice: number;
  areaPrice: number;
  weightCost: number;
  dimensionCost: number;
  totalCost: number;
  areaName?: string;
  calculatedWeight: number; // in kg
  calculatedVolume: number; // in cm3
  dimensionalWeight?: number; // in kg
}

/**
 * Find the matching shipping area based on city, zipCode, or country
 * Uses the shipping area service to find matching areas
 */
const findShippingArea = async (
  city?: string,
  zipCode?: string,
  country?: string
): Promise<IShippingArea | null> => {
  return await shippingAreaServices.findMatchingShippingAreaService(
    city,
    zipCode,
    country
  );
};

/**
 * Calculate dimensional weight (volumetric weight)
 * Formula: (L x W x H) / divisor
 */
const calculateDimensionalWeight = (
  length: number,
  width: number,
  height: number,
  divisor: number = 5000
): number => {
  return (length * width * height) / divisor; // Result in kg
};

/**
 * Calculate total weight from items
 */
const calculateTotalWeight = (
  items: IShippingCalculationInput["items"]
): number => {
  return items.reduce((total, item) => {
    const itemWeight = (item.weight || 0) * item.quantity; // in grams
    return total + itemWeight;
  }, 0) / 1000; // Convert to kg
};

/**
 * Calculate total volume from items
 */
const calculateTotalVolume = (
  items: IShippingCalculationInput["items"]
): number => {
  return items.reduce((total, item) => {
    const itemVolume =
      (item.length || 0) * (item.width || 0) * (item.height || 0) * item.quantity; // in cm3
    return total + itemVolume;
  }, 0);
};

/**
 * Calculate shipping cost based on weight, dimensions, and area
 */
export const calculateShippingCost = async (
  input: IShippingCalculationInput
): Promise<IShippingCalculationResult> => {
  const { slotId, courier, items, shippingAddress } = input;

  // Find the selected shipping slot
  const slot = courier.shippingSlots.find(
    (s) => s._id?.toString() === slotId.toString()
  );

  if (!slot) {
    throw new Error(`Shipping slot with ID ${slotId} not found`);
  }

  // Calculate totals
  const totalWeight = calculateTotalWeight(items); // in kg
  const totalVolume = calculateTotalVolume(items); // in cm3

  // Calculate dimensional weight if enabled
  let dimensionalWeight: number | undefined;
  if (slot.useDimensionalWeight && items.length > 0) {
    // Use the largest item's dimensions for dimensional weight calculation
    const largestItem = items.reduce((max, item) => {
      const maxVolume =
        (max.length || 0) * (max.width || 0) * (max.height || 0);
      const itemVolume =
        (item.length || 0) * (item.width || 0) * (item.height || 0);
      return itemVolume > maxVolume ? item : max;
    }, items[0]);

    if (
      largestItem.length &&
      largestItem.width &&
      largestItem.height
    ) {
      dimensionalWeight = calculateDimensionalWeight(
        largestItem.length,
        largestItem.width,
        largestItem.height,
        slot.dimensionalWeightDivisor || 5000
      );
    }
  }

  // Find matching area from shipping area module
  const matchedArea = await findShippingArea(
    shippingAddress.city,
    shippingAddress.zipCode,
    shippingAddress.country
  );

  // Calculate area cost (always included)
  // If area matches a specific area, use that area's price
  // Otherwise, use the default "other areas" price from the default shipping area
  let areaBasePrice = 0;
  if (matchedArea) {
    areaBasePrice = matchedArea.basePrice;
  } else {
    // Get default shipping area for "other areas" price
    const defaultArea = await shippingAreaServices.getDefaultShippingAreaService();
    if (defaultArea) {
      areaBasePrice = defaultArea.basePrice;
    }
  }
  const areaMultiplier = matchedArea?.priceMultiplier || 1;
  const areaPrice = areaBasePrice * areaMultiplier;

  // Calculate dimension cost (if dimension pricing is configured)
  // NOTE: In standard DHL/Courier formulas, we do NOT charge separately for dimensions.
  // We uses "Chargeable Weight" (Max of Actual vs Volumetric) in the weight cost instead.
  // Keeping this variable as 0 for backward compatibility with the interface.
  const dimensionCost = 0;

  /*
  // Legacy Logic for reference:
  if (slot.dimensionMultiplier && slot.dimensionMultiplier > 0) {
    if (slot.dimensionUnit === "1000cm3") {
      dimensionCost = (totalVolume / 1000) * slot.dimensionMultiplier;
    } else {
      dimensionCost = totalVolume * slot.dimensionMultiplier;
    }
  }
  */

  // Calculate weight cost (if weight pricing is configured)
  let weightCost = 0;
  if (slot.weightMultiplier && slot.weightMultiplier > 0) {
    const weightToUse = dimensionalWeight && dimensionalWeight > totalWeight
      ? dimensionalWeight
      : totalWeight;

    if (slot.weightUnit === "100g") {
      weightCost = (weightToUse * 10) * slot.weightMultiplier; // Convert kg to 100g
    } else {
      weightCost = weightToUse * slot.weightMultiplier; // Already in kg
    }
  }

  // Total cost = Area Cost + Chargeable Weight Cost
  // We removed the separate "dimensionCost" addition to avoid double-charging.
  const totalCost = areaPrice + weightCost;

  return {
    basePrice: areaBasePrice, // The base price used (from matched area or default)
    areaPrice,
    weightCost,
    dimensionCost,
    totalCost: Math.max(0, totalCost), // Ensure non-negative
    areaName: matchedArea?.areaName,
    calculatedWeight: totalWeight,
    calculatedVolume: totalVolume,
    dimensionalWeight,
  };
};