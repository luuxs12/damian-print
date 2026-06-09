export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface Category {
  id:          number;
  name:        string;
  description?: string;
  status:      CategoryStatus;
  createdAt:   string;
  productsCount?: number;
}
