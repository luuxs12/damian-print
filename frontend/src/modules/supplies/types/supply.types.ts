export type SupplyStatus = "ACTIVE" | "INACTIVE";

export interface Supply {
  id:           number;
  code:         string;
  name:         string;
  description?: string;
  stock:        number;
  minStock:     number;
  unit:         string;
  cost:         number;
  status:       SupplyStatus;
  createdAt:    string;
}
