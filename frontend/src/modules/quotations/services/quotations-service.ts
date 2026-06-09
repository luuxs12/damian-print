const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const getHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};

export interface QuotationItem {
  id?:          number;
  description:  string;
  quantity:     number;
  unitPrice:    number;
  totalPrice:   number;
}

export interface Quotation {
  id:              number;
  quotationNumber: string;
  clientId:        number | null;
  clientName:      string;
  clientDocument:  string;
  clientPhone:     string | null;
  clientEmail:     string | null;
  clientAddress:   string | null;
  subtotal:        number;
  discount:        number;
  tax:             number;
  total:           number;
  status:          "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  validUntil:      string;
  notes:           string | null;
  createdAt:       string;
  updatedAt:       string;
  items?:          QuotationItem[];
}

export interface QuotationStats {
  total:    number;
  pending:  number;
  approved: number;
  rejected: number;
  expired:  number;
  revenue:  number;
}

export interface CreateQuotationPayload {
  clientId?:      number | null;
  clientName:     string;
  clientDocument: string;
  clientPhone?:   string;
  clientEmail?:   string;
  clientAddress?: string;
  items:          Omit<QuotationItem, "id">[];
  discount?:      number;
  tax?:           number;
  validUntil:     string;
  notes?:         string;
}

export const quotationsService = {
  getAll: async (): Promise<Quotation[]> => {
    const res = await fetch(`${API_URL}/quotations`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getStats: async (): Promise<QuotationStats> => {
    const res = await fetch(`${API_URL}/quotations/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getById: async (id: number): Promise<Quotation> => {
    const res = await fetch(`${API_URL}/quotations/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  create: async (payload: CreateQuotationPayload): Promise<Quotation> => {
    const res = await fetch(`${API_URL}/quotations`, {
      method:  "POST",
      headers: getHeaders(),
      body:    JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  update: async (id: number, payload: Partial<CreateQuotationPayload>): Promise<Quotation> => {
    const res = await fetch(`${API_URL}/quotations/${id}`, {
      method:  "PUT",
      headers: getHeaders(),
      body:    JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateStatus: async (id: number, status: string): Promise<Quotation> => {
    const res = await fetch(`${API_URL}/quotations/${id}/status`, {
      method:  "PATCH",
      headers: getHeaders(),
      body:    JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/quotations/${id}`, {
      method:  "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  sendEmail: async (id: number): Promise<{ message: string; sent: boolean }> => {
    const res = await fetch(`${API_URL}/quotations/${id}/send-email`, {
      method:  "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
