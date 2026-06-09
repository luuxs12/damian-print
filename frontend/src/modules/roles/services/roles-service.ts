import { api } from "../../../core/api";
import type { Role } from "../types/role.types";

export const rolesService = {
  async getRoles(): Promise<Role[]> {
    const response = await api.get("/roles");
    return response.data;
  },

  async createRole(data: Partial<Role>): Promise<Role> {
    const response = await api.post("/roles", data);
    return response.data;
  },

  async updateRole(id: number, data: Partial<Role>): Promise<Role> {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  async deleteRole(id: number): Promise<void> {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
};
