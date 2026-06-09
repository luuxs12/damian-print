export interface CreateSupplyDTO {
  code:         string;
  name:         string;
  description?: string;
  stock:        number;
  minStock?:    number;
  unit:         string;
  cost:         number;
}

export interface UpdateSupplyDTO {
  code?:        string;
  name?:        string;
  description?: string;
  stock?:        number;
  minStock?:    number;
  unit?:        string;
  cost?:        number;
  status?:      "ACTIVE" | "INACTIVE";
}
