import { api } from "@/core/api";
import type { Client, ClientStats } from "../types/client.types";

export interface CreateClientPayload {
  type:          "EMPRESA" | "PARTICULAR";
  name:          string;
  documentType:  "DNI" | "RUC" | "CE" | "PASAPORTE";
  document:      string;
  phone?:        string;
  email?:        string;
  address?:      string;
  city?:         string;
  contactName?:  string;
  notes?:        string;
  status?:       "ACTIVE" | "INACTIVE";
}

export const clientsService = {

  async getClients(): Promise<Client[]> {
    const res = await api.get("/clients");
    return res.data;
  },

  async getStats(): Promise<ClientStats> {
    const res = await api.get("/clients/stats");
    return res.data;
  },

  async getClientById(id: number): Promise<Client> {
    const res = await api.get(`/clients/${id}`);
    return res.data;
  },

  async searchClients(q: string): Promise<Client[]> {
    const res = await api.get("/clients/search", { params: { q } });
    return res.data;
  },

  async createClient(data: CreateClientPayload): Promise<Client> {
    const res = await api.post("/clients", data);
    return res.data;
  },

  async updateClient(id: number, data: Partial<CreateClientPayload>): Promise<Client> {
    const res = await api.put(`/clients/${id}`, data);
    return res.data;
  },

  async toggleStatus(id: number): Promise<Client> {
    const res = await api.patch(`/clients/${id}/toggle-status`);
    return res.data;
  },

  async deleteClient(id: number): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
