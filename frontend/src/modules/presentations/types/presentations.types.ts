export interface Presentation {
  id: number;
  productId: number;
  productName?: string;
  categoryId?: number;
  categoryName?: string;
  name: string;
  description?: string | null;
  size?: string | null;
  material?: string | null;
  finish?: string | null;
  color?: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  cost: number;
  price: number;
  wholesalePrice: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}
