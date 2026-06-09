export interface CreateProductionOrderDTO {
  orderNumber?: string;
  productId?: number;
  productName: string;
  clientName: string;
  quantity: number;
  branchName: string;
  status?: string;
  promisedDate: string | Date;
  notes?: string;
}

export interface UpdateProductionOrderDTO {
  status?: string;
  branchName?: string;
  promisedDate?: string | Date;
  notes?: string;
}
