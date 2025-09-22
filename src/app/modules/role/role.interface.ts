export interface IRole {
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  status: boolean;
}
