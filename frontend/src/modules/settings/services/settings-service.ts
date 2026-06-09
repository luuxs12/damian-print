import { api } from "@/core/api";
import { authStore } from "@/modules/auth/store/auth-store";

export interface Settings {
  id:             number;
  companyName:    string;
  companyRuc:     string;
  companyEmail:   string;
  companyPhone:   string;
  companyAddress: string;
  systemLogo:     string | null;
  yapeQr:         string | null;
  plinQr:         string | null;
  updatedAt:      string;
}

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const res = await api.get("/settings");
    return res.data;
  },

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const res = await api.put("/settings", data);
    return res.data;
  },

  async uploadSettingFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000";
    const session = authStore.getSession();
    const token = session?.token ?? "";
    
    const res = await fetch(`${baseUrl}/settings/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? "Error al subir el archivo.");
    }
    
    const json = await res.json() as { url: string };
    return json.url;
  },

  async downloadBackup(): Promise<void> {
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000";
    const session = authStore.getSession();
    const token = session?.token ?? "";

    const res = await fetch(`${baseUrl}/settings/backup`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("No se pudo descargar la copia de seguridad.");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-damian-print-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async restoreBackup(backupJson: Record<string, unknown>): Promise<void> {
    await api.post("/settings/restore", { backup: backupJson });
  },

  async resetDatabase(): Promise<void> {
    await api.post("/settings/reset");
  }
};
