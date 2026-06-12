import { authStore } from "@/modules/auth/store/auth-store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const getHeaders = () => {
  const session = authStore.getSession();
  const token = session?.token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    authStore.clearSession();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = "/login";
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};

export interface DashboardStats {
  kpis: {
    ingresos: number;
    pedidos: number;
    entregas: number;
    enEspera: number;
  };
  chartData: {
    label: string;
    ingresos: number;
    pedidos: number;
  }[];
  breakdown: {
    completados: number;
    cancelados: number;
    clientes: number;
    productos: number;
  };
}

export const dashboardService = {
  getStats: async (start?: string, end?: string): Promise<DashboardStats> => {
    let url = `${API_URL}/dashboard/stats`;
    const params = new URLSearchParams();
    if (start) params.append("start", start);
    if (end) params.append("end", end);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
};
