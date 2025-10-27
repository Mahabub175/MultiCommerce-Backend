export interface IAttributeOption {
  name: string;
  label: string;
}

export interface IAttribute {
  name: string;
  options: IAttributeOption[];
  status: boolean;
}
