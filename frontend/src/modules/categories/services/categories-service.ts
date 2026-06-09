import { api } from "@/core/api";
import type { Category } from "../types/category.types";

export const categoriesService = {

  async getCategories(): Promise<Category[]> {
    const res = await api.get("/categories");
    return res.data;
  },

  async createCategory(data: Pick<Category, "name" | "description" | "status">): Promise<Category> {
    const res = await api.post("/categories", data);
    return res.data;
  },

  async updateCategory(id: number, data: Pick<Category, "name" | "description" | "status">): Promise<Category> {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  /* Alterna ACTIVE ↔ INACTIVE */
  async toggleStatus(id: number): Promise<Category> {
    const res = await api.patch(`/categories/${id}/toggle`);
    return res.data;
  },
};
