import { authStore } from "../../auth/store/auth-store";

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

export interface SaleItem {
  id?:         number;
  description: string;
  quantity:    number;
  unitPrice:   number;
  totalPrice:  number;
  promisedDate?: string;
}

export interface Sale {
  id:             number;
  saleNumber:     string;
  quotationId:    number | null;
  clientId:       number | null;
  clientName:     string;
  clientDocument: string;
  clientPhone:    string | null;
  clientEmail:    string | null;
  clientAddress:  string | null;
  subtotal:       number;
  discount:       number;
  tax:            number;
  total:          number;
  status:         "PENDIENTE" | "A_CUENTA" | "PAGADA" | "ANULADA";
  paymentMethod:  "EFECTIVO" | "TRANSFERENCIA" | "YAPE" | "PLIN" | "TARJETA" | "MULTIPLE";
  paymentDetails: string | null;
  advancePayment: number;
  billingType:    "NOTA_DE_VENTA" | "BOLETA" | "FACTURA";
  billingNumber:  string | null;
  createdAt:      string;
  updatedAt:      string;
  items?:         SaleItem[];
}

export interface SaleStats {
  total:     number;
  pending:   number;
  paid:      number;
  cancelled: number;
  revenue:   number;
}

export interface CreateSalePayload {
  quotationId?:    number | null;
  clientId?:       number | null;
  clientName:      string;
  clientDocument:  string;
  clientPhone?:    string;
  clientEmail?:    string;
  clientAddress?:  string;
  items:           Omit<SaleItem, "id">[];
  discount?:       number;
  tax?:            number;
  status?:         string;
  paymentMethod?:  string;
  paymentDetails?: string;
  advancePayment?: number;
  billingType?:    string;
  billingNumber?:  string;
}

export const salesService = {
  getAll: async (): Promise<Sale[]> => {
    const res = await fetch(`${API_URL}/sales`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getStats: async (): Promise<SaleStats> => {
    const res = await fetch(`${API_URL}/sales/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getById: async (id: number): Promise<Sale> => {
    const res = await fetch(`${API_URL}/sales/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  create: async (payload: CreateSalePayload): Promise<Sale> => {
    const res = await fetch(`${API_URL}/sales`, {
      method:  "POST",
      headers: getHeaders(),
      body:    JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  update: async (id: number, payload: Partial<CreateSalePayload>): Promise<Sale> => {
    const res = await fetch(`${API_URL}/sales/${id}`, {
      method:  "PUT",
      headers: getHeaders(),
      body:    JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/sales/${id}`, {
      method:  "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  sendEmail: async (id: number): Promise<{ message: string; sent: boolean }> => {
    const res = await fetch(`${API_URL}/sales/${id}/send-email`, {
      method:  "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
