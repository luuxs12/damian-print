import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "../../db";
import { sales, saleItems } from "../../db/schema/sales";
import { clients } from "../../db/schema/clients";
import { quotations } from "../../db/schema/quotations";
import { productionOrders } from "../../db/schema/production";
import { products } from "../../db/schema/products";
import type { CreateSaleDTO, UpdateSaleDTO } from "./sales.types";

const VALID_STATUSES = ["PENDIENTE", "PAGADA", "ANULADA"];
const VALID_PAYMENT_METHODS = ["EFECTIVO", "TRANSFERENCIA", "YAPE", "PLIN", "TARJETA"];
const VALID_BILLING_TYPES = ["NOTA_DE_VENTA", "BOLETA", "FACTURA"];

/* ── Number generators ─────────────────────────────────── */
const nextSaleNumber = async (): Promise<string> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sales);
  const n = Number(row.count) + 1;
  return `VEN-${String(n).padStart(4, "0")}`;
};

const nextBillingNumber = async (type: "BOLETA" | "FACTURA"): Promise<string> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sales)
    .where(eq(sales.billingType, type));
  
  const prefix = type === "BOLETA" ? "B001" : "F001";
  const n = Number(row.count) + 1;
  return `${prefix}-${String(n).padStart(6, "0")}`;
};

/* ── Helpers ──────────────────────────────────────────── */
const calcTotals = (
  items: { quantity: number; unitPrice: number }[],
  discount = 0,
  tax = 0
) => {
  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const afterDiscount = subtotal - discount;
  const taxAmount = afterDiscount * (tax / 100);
  return {
    subtotal,
    total: afterDiscount + taxAmount,
  };
};

const autoCreateProductionOrdersForSale = async (saleId: number) => {
  try {
    // 1. Fetch the sale details
    const [sale] = await db.select().from(sales).where(eq(sales.id, saleId));
    if (!sale || sale.status !== "PAGADA") return;

    // 2. Fetch the items for this sale
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    if (!items.length) return;

    // 3. Fetch all active products to match by name
    const activeProducts = await db.select().from(products).where(eq(products.status, "ACTIVE"));

    for (const item of items) {
      // Find matching product by name (case-insensitive)
      const matchedProduct = activeProducts.find(
        (p) => p.name.toLowerCase().trim() === item.description.toLowerCase().trim()
      );

      // Check if product requires production.
      if (matchedProduct && !matchedProduct.sendToProduction) {
        continue; // Skip if explicitly disabled for production
      }

      // Calculate promised date based on product's overheadCost (elaboration days)
      const days = matchedProduct && matchedProduct.overheadCost ? Math.round(Number(matchedProduct.overheadCost)) : 2;
      const promisedDate = new Date();
      promisedDate.setDate(promisedDate.getDate() + (days > 0 ? days : 2));

      // Check if a production order already exists for this sale item to avoid duplicate orders
      const [existingOrder] = await db
        .select()
        .from(productionOrders)
        .where(
          and(
            eq(productionOrders.clientName, sale.clientName),
            eq(productionOrders.productName, item.description),
            sql`${productionOrders.notes} LIKE ${'%' + sale.saleNumber + '%'}`
          )
        );
      if (existingOrder) continue;

      // Generate unique production order number
      const count = await db.select({ id: productionOrders.id }).from(productionOrders);
      const orderNumber = `OP-${String(count.length + 1).padStart(4, "0")}`;

      // Insert production order
      await db.insert(productionOrders).values({
        orderNumber,
        productId: matchedProduct ? matchedProduct.id : null,
        productName: item.description,
        clientName: sale.clientName,
        quantity: item.quantity,
        branchName: "Local Principal",
        status: "PENDING",
        promisedDate,
        notes: `Generado automáticamente desde la venta ${sale.saleNumber}.`
      });
    }
  } catch (err) {
    console.error("Error auto-creating production orders for sale:", err);
  }
};

/* ── Service Implementation ───────────────────────────── */
export const salesService = {

  getAll: async () => {
    return await db
      .select()
      .from(sales)
      .orderBy(desc(sales.createdAt));
  },

  getById: async (id: number) => {
    const [s] = await db.select().from(sales).where(eq(sales.id, id));
    if (!s) throw new Error("Venta no encontrada.");

    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, id));

    return { ...s, items };
  },

  getStats: async () => {
    const [total]     = await db.select({ count: sql<number>`count(*)` }).from(sales);
    const [pendiente] = await db.select({ count: sql<number>`count(*)` }).from(sales).where(eq(sales.status, "PENDIENTE"));
    const [pagada]    = await db.select({ count: sql<number>`count(*)` }).from(sales).where(eq(sales.status, "PAGADA"));
    const [anulada]   = await db.select({ count: sql<number>`count(*)` }).from(sales).where(eq(sales.status, "ANULADA"));

    // Total income from paid sales
    const [revenue] = await db
      .select({ sum: sql<number>`coalesce(sum(total), 0)` })
      .from(sales)
      .where(eq(sales.status, "PAGADA"));

    return {
      total:     Number(total.count),
      pending:   Number(pendiente.count),
      paid:      Number(pagada.count),
      cancelled: Number(anulada.count),
      revenue:   Number(revenue.sum),
    };
  },

  create: async (data: CreateSaleDTO) => {
    if (!data.clientName?.trim()) throw new Error("El nombre del cliente es obligatorio.");
    if (!data.clientDocument?.trim()) throw new Error("El documento del cliente es obligatorio.");
    if (!data.items?.length) throw new Error("La venta debe tener al menos un ítem.");

    const parsedItems = data.items.map((item) => ({
      description: item.description,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      totalPrice:  item.quantity * item.unitPrice,
    }));

    const discount = data.discount ?? 0;
    const tax      = data.tax ?? 18;
    const { subtotal, total } = calcTotals(parsedItems, discount, tax);

    // ── Auto-register client if not exists ──
    const doc = data.clientDocument.trim();
    let clientId = data.clientId ?? null;
    if (doc) {
      const [existingClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.document, doc));
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const docType = doc.length === 11 ? "RUC" : "DNI";
        const clientType = docType === "RUC" ? "EMPRESA" : "PARTICULAR";
        try {
          const [newClient] = await db
            .insert(clients)
            .values({
              name: data.clientName.trim(),
              documentType: docType,
              document: doc,
              phone: data.clientPhone?.trim() || null,
              email: data.clientEmail?.trim() || null,
              address: data.clientAddress?.trim() || null,
              type: clientType,
              status: "ACTIVE",
            })
            .returning();
          clientId = newClient.id;
        } catch (err) {
          console.error("Error auto-registering client on sale creation:", err);
        }
      }
    }

    const saleNumber = await nextSaleNumber();
    let billingNumber = data.billingNumber || null;
    const billingType = data.billingType || "NOTA_DE_VENTA";

    if (!billingNumber && (billingType === "BOLETA" || billingType === "FACTURA")) {
      billingNumber = await nextBillingNumber(billingType);
    }

    const [newSale] = await db
      .insert(sales)
      .values({
        saleNumber,
        quotationId:    data.quotationId || null,
        clientId,
        clientName:     data.clientName.trim(),
        clientDocument: data.clientDocument.trim(),
        clientPhone:    data.clientPhone?.trim() || null,
        clientEmail:    data.clientEmail?.trim() || null,
        clientAddress:  data.clientAddress?.trim() || null,
        subtotal,
        discount,
        tax,
        total,
        status:         data.status || "PENDIENTE",
        paymentMethod:  data.paymentMethod || "EFECTIVO",
        billingType,
        billingNumber,
      })
      .returning();

    // Insert items
    await db.insert(saleItems).values(
      parsedItems.map((item) => ({
        saleId: newSale.id,
        ...item,
      }))
    );

    // If quotationId is provided, mark that quotation as APPROVED
    if (data.quotationId) {
      await db
        .update(quotations)
        .set({ status: "APPROVED", updatedAt: new Date() })
        .where(eq(quotations.id, data.quotationId));
    }

    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, newSale.id));

    await autoCreateProductionOrdersForSale(newSale.id);

    return { ...newSale, items };
  },

  update: async (id: number, data: UpdateSaleDTO) => {
    const [existing] = await db.select().from(sales).where(eq(sales.id, id));
    if (!existing) throw new Error("Venta no encontrada.");

    if (data.status && !VALID_STATUSES.includes(data.status)) {
      throw new Error("Estado inválido.");
    }
    if (data.paymentMethod && !VALID_PAYMENT_METHODS.includes(data.paymentMethod)) {
      throw new Error("Método de pago inválido.");
    }
    if (data.billingType && !VALID_BILLING_TYPES.includes(data.billingType)) {
      throw new Error("Tipo de comprobante inválido.");
    }

    // ── Validation: CANNOT change billingType if it was already BOLETA or FACTURA ──
    if (
      existing.billingType !== "NOTA_DE_VENTA" &&
      data.billingType !== undefined &&
      data.billingType !== existing.billingType
    ) {
      throw new Error(`Esta venta ya fue emitida como ${existing.billingType}. No se puede cambiar a ${data.billingType}.`);
    }

    const patch: Record<string, any> = { updatedAt: new Date() };

    // Auto-generate billing number if transitioning from NOTA_DE_VENTA to BOLETA or FACTURA
    if (
      existing.billingType === "NOTA_DE_VENTA" &&
      data.billingType &&
      data.billingType !== "NOTA_DE_VENTA"
    ) {
      patch.billingType = data.billingType;
      patch.billingNumber = await nextBillingNumber(data.billingType as "BOLETA" | "FACTURA");
    } else if (data.billingType !== undefined) {
      patch.billingType = data.billingType;
    }

    if (data.clientName     !== undefined) patch.clientName     = data.clientName.trim();
    if (data.clientDocument !== undefined) patch.clientDocument = data.clientDocument.trim();
    if (data.clientPhone    !== undefined) patch.clientPhone    = data.clientPhone?.trim() || null;
    if (data.clientEmail    !== undefined) patch.clientEmail    = data.clientEmail?.trim() || null;
    if (data.clientAddress  !== undefined) patch.clientAddress  = data.clientAddress?.trim() || null;
    if (data.status         !== undefined) patch.status         = data.status;
    if (data.paymentMethod  !== undefined) patch.paymentMethod  = data.paymentMethod;

    if (data.items?.length) {
      const parsedItems = data.items.map((item) => ({
        description: item.description,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
        totalPrice:  item.quantity * item.unitPrice,
      }));
      const discount = data.discount ?? existing.discount ?? 0;
      const tax      = data.tax ?? existing.tax ?? 18;
      const { subtotal, total } = calcTotals(parsedItems, discount, tax);

      patch.subtotal = subtotal;
      patch.discount = discount;
      patch.tax      = tax;
      patch.total    = total;

      // Replace items
      await db.delete(saleItems).where(eq(saleItems.saleId, id));
      await db.insert(saleItems).values(
        parsedItems.map((item) => ({ saleId: id, ...item }))
      );
    } else {
      if (data.discount !== undefined) patch.discount = data.discount;
      if (data.tax      !== undefined) patch.tax      = data.tax;
    }

    const [updated] = await db
      .update(sales)
      .set(patch)
      .where(eq(sales.id, id))
      .returning();

    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, id));

    await autoCreateProductionOrdersForSale(updated.id);

    return { ...updated, items };
  },

  delete: async (id: number) => {
    const [existing] = await db.select().from(sales).where(eq(sales.id, id));
    if (!existing) throw new Error("Venta no encontrada.");
    await db.delete(sales).where(eq(sales.id, id));
    return existing;
  },
};
