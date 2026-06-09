export interface PriceScale {
  minQty: number;
  price: number;
}

export interface SpecialPrice {
  clientId: number;
  clientName: string;
  price: number;
}

export interface ProductPresentation {
  id?: number;
  presentation: string;
  price: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  unit: string;
  categoryId: number;
  categoryName?: string;
  status: "ACTIVE" | "INACTIVE";
  imageUrl?: string | null;
  createdAt: string;
  createdById?: number | null;
  createdByUsername?: string | null;
  presentationsCount?: number;
  presentations?: ProductPresentation[];

  // Characteristics
  manageInventory: boolean;
  countAsPrint: boolean;
  sendToProduction: boolean;
  branchName?: string | null;

  // Advanced Pricing
  pricePublic: number;
  priceReseller: number;
  priceScales?: PriceScale[] | null;
  specialPrices?: SpecialPrice[] | null;

  // Costs & Materials
  laborCost?: number;
  overheadCost?: number;
  materials?: ProductMaterial[] | null;
}

export interface ProductMaterial {
  supplyId: number;
  name: string;
  unit: string;
  qty: number;
  cost: number;
}
