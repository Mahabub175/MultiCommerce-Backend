export interface ICustomRole {
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumQuantity: number;
  status: boolean;
}
