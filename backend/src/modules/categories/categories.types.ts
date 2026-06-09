export interface CreateCategoryDTO {
  name:        string;
  description?: string;
}

export interface UpdateCategoryDTO {
  name?:        string;
  description?: string;
  status?:      "ACTIVE" | "INACTIVE";
}
