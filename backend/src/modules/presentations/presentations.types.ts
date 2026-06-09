export interface CreatePresentationDTO {
  productId: number;
  name: string;
  description?: string;
  size?: string;
  material?: string;
  finish?: string;
  color?: string;
  quantity?: string;
  imageUrl?: string;
  cost?: number;
  price?: number;
  wholesalePrice?: number;
}

export interface UpdatePresentationDTO {
  productId?: number;
  name?: string;
  description?: string;
  size?: string;
  material?: string;
  finish?: string;
  color?: string;
  quantity?: string;
  imageUrl?: string;
  cost?: number;
  price?: number;
  wholesalePrice?: number;
  status?: "ACTIVE" | "INACTIVE";
}
