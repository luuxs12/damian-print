export interface CreatePresentationDTO {
  presentation: string;
  price: number;
}

export interface PriceScale {
  minQty: number;
  price: number;
}

export interface SpecialPrice {
  clientId: number;
  clientName: string;
  price: number;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  unit?: string;
  categoryId: number;
  status?: "ACTIVE" | "INACTIVE";
  imageUrl?: string;
  presentations?: CreatePresentationDTO[];

  // Characteristics
  manageInventory?: boolean;
  countAsPrint?: boolean;
  sendToProduction?: boolean;
  branchName?: string;

  // Advanced Pricing
  pricePublic?: number;
  priceReseller?: number;
  priceScales?: PriceScale[];
  specialPrices?: SpecialPrice[];
  
  // Costs & Materials
  laborCost?: number;
  overheadCost?: number;
  materials?: any[];
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  unit?: string;
  categoryId?: number;
  status?: "ACTIVE" | "INACTIVE";
  imageUrl?: string;
  presentations?: CreatePresentationDTO[];

  // Characteristics
  manageInventory?: boolean;
  countAsPrint?: boolean;
  sendToProduction?: boolean;
  branchName?: string;

  // Advanced Pricing
  pricePublic?: number;
  priceReseller?: number;
  priceScales?: PriceScale[];
  specialPrices?: SpecialPrice[];

  // Costs & Materials
  laborCost?: number;
  overheadCost?: number;
  materials?: any[];
}
