import { api } from "@/core/api";

export interface ProductionOrder {
  id: number;
  orderNumber: string;
  productId: number | null;
  productName: string;
  clientName: string;
  quantity: number;
  branchName: string;
  status: "PENDING" | "DESIGN" | "PRINTING" | "FINISHING" | "READY" | "DELIVERED";
  promisedDate: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateProductionOrderPayload {
  productId?: number;
  productName: string;
  clientName: string;
  quantity: number;
  branchName: string;
  status?: string;
  promisedDate: string;
  notes?: string;
}

export interface UpdateProductionOrderPayload {
  status?: string;
  branchName?: string;
  promisedDate?: string;
  notes?: string;
}

export const productionService = {
  async getProductionOrders(): Promise<ProductionOrder[]> {
    const res = await api.get("/production");
    return res.data;
  },

  async createProductionOrder(payload: CreateProductionOrderPayload): Promise<ProductionOrder> {
    const res = await api.post("/production", payload);
    return res.data;
  },

  async updateProductionOrder(id: number, payload: UpdateProductionOrderPayload): Promise<ProductionOrder> {
    const res = await api.put(`/production/${id}`, payload);
    return res.data;
  },

  async deleteProductionOrder(id: number): Promise<void> {
    await api.delete(`/production/${id}`);
  },
};
