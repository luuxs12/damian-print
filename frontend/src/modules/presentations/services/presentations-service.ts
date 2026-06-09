import { api } from "@/core/api";
import type { Presentation } from "../types/presentations.types";

export const presentationsService = {

  async getPresentations(): Promise<Presentation[]> {
    const res = await api.get("/presentations");
    return res.data;
  },

  async createPresentation(data: Omit<Presentation, "id" | "status" | "createdAt">): Promise<Presentation> {
    const res = await api.post("/presentations", data);
    return res.data;
  },

  async updatePresentation(id: number, data: Partial<Omit<Presentation, "id" | "createdAt">>): Promise<Presentation> {
    const res = await api.put(`/presentations/${id}`, data);
    return res.data;
  },

  async deletePresentation(id: number): Promise<void> {
    await api.delete(`/presentations/${id}`);
  },

  /* Alterna ACTIVE ↔ INACTIVE */
  async toggleStatus(id: number): Promise<Presentation> {
    const res = await api.patch(`/presentations/${id}/toggle`);
    return res.data;
  },
};
