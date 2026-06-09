import { api } from "@/core/api";
import type { Product } from "../types/product.types";

export interface CreateProductPayload {
  name: string;
  description?: string;
  categoryId: number;
  status: "ACTIVE" | "INACTIVE";
  imageUrl?: string | null;
  presentations?: { presentation: string; price: number }[];
}

export const productsService = {

  async getProducts(): Promise<Product[]> {
    const res = await api.get("/products");
    return res.data;
  },

  async getProductById(id: number): Promise<Product> {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  async createProduct(data: CreateProductPayload): Promise<Product> {
    const res = await api.post("/products", data);
    return res.data;
  },

  async updateProduct(id: number, data: Partial<CreateProductPayload>): Promise<Product> {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  /**
   * Sube una imagen de producto.
   * Devuelve la URL relativa (/uploads/products/uuid.ext)
   * que el backend sirve con Cache-Control de 1 año.
   */
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    // Usamos fetch directamente para multipart (axios complica el boundary)
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000";
    const token = localStorage.getItem("token") ?? "";
    const res = await fetch(`${baseUrl}/uploads/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? "Error al subir la imagen.");
    }
    const json = await res.json() as { url: string };
    return json.url;
  },

  /**
   * Calcula el precio del producto según la cantidad ingresada,
   * el cliente opcional y si es revendedor.
   */
  calculateProductPrice(
    product: Product,
    qty: number,
    clientId?: number | null,
    isReseller?: boolean
  ): number {
    // 1. Validar precio especial de cliente
    if (clientId && product.specialPrices) {
      const spec = product.specialPrices.find((s) => s.clientId === clientId);
      if (spec) return Number(spec.price);
    }

    // 2. Validar escala de mayoreo por cantidad
    if (product.priceScales && product.priceScales.length > 0) {
      const sortedScales = [...product.priceScales].sort((a, b) => b.minQty - a.minQty);
      const matched = sortedScales.find((scale) => qty >= scale.minQty);
      if (matched) return Number(matched.price);
    }

    // 3. Devolver precio base (revendedor o público)
    return isReseller ? Number(product.priceReseller ?? 0) : Number(product.pricePublic ?? 0);
  }
};
