export interface IShippingArea {
  _id?: string;
  areaName: string; // e.g., "Local", "Metro", "Remote", or "Other Areas" for default
  cities?: string[]; // Specific cities in this area
  zipCodes?: string[]; // Specific zip codes in this area
  basePrice: number; // Base price for this area
  priceMultiplier?: number; // Multiplier for this area (default: 1)
  isDefault?: boolean; // If true, this is the default "other areas" price (only one should be true)
  status?: boolean; // Active/inactive status
  createdAt?: Date;
  updatedAt?: Date;
}
