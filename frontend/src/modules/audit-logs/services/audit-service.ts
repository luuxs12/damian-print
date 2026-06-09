import { api } from "@/core/api";

export interface AuditLog {
  id: number;
  userId: number | null;
  username: string;
  module: string;
  action: string;
  description: string;
  hasDetails: boolean;
  details?: Record<string, unknown>; // Optional, present in legacy/cached api responses or loaded lazily
  createdAt: string;
}

export const auditService = {
  async getLogs(): Promise<AuditLog[]> {
    const response = await api.get<AuditLog[]>("/audit-logs");
    return response.data;
  },

  async getLogDetails(id: number): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>(`/audit-logs/${id}/details`);
    return response.data;
  }
};
