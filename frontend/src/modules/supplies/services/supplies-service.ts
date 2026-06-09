import { api } from "@/core/api";
import type { Supply } from "../types/supply.types";

export const suppliesService = {

  async getSupplies(): Promise<Supply[]> {
    const res = await api.get("/supplies");
    return res.data;
  },

  async createSupply(data: Omit<Supply, "id" | "createdAt">): Promise<Supply> {
    const res = await api.post("/supplies", data);
    return res.data;
  },

  async updateSupply(id: number, data: Partial<Omit<Supply, "id" | "createdAt">>): Promise<Supply> {
    const res = await api.put(`/supplies/${id}`, data);
    return res.data;
  },

  async deleteSupply(id: number): Promise<void> {
    await api.delete(`/supplies/${id}`);
  },

  /* Alterna ACTIVE ↔ INACTIVE */
  async toggleStatus(id: number): Promise<Supply> {
    const res = await api.patch(`/supplies/${id}/toggle`);
    return res.data;
  },
};
