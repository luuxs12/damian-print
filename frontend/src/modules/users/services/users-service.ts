import { api } from "../../../core/api";
import type { User } from "../types/user.types";

export const usersService = {
  async getUsers() {
    const response = await api.get("/users");
    return response.data;
  },

  async createUser(data: Partial<User>) {
    const response = await api.post("/users", data);
    return response.data;
  },

  async updateUser(id: number, data: Partial<User>) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};