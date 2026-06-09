import { eq, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { quotations, quotationItems } from "../../db/schema/quotations";
import type { CreateQuotationDTO, UpdateQuotationDTO } from "./quotations.types";

const VALID_STATUSES: readonly string[] = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] as const;

/* ── Number generator ─────────────────────────────────── */
const nextQuotationNumber = async (): Promise<string> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(quotations);
  const n = Number(row.count) + 1;
  return `COT-${String(n).padStart(4, "0")}`;
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

/* ── Queries ──────────────────────────────────────────── */
export const quotationsService = {

  getAll: async () => {
    const rows = await db
      .select()
      .from(quotations)
      .orderBy(desc(quotations.createdAt));
    return rows;
  },

  getById: async (id: number) => {
    const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!q) throw new Error("Cotización no encontrada.");

    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id));

    return { ...q, items };
  },

  getStats: async () => {
    const [total]    = await db.select({ count: sql<number>`count(*)` }).from(quotations);
    const [pending]  = await db.select({ count: sql<number>`count(*)` }).from(quotations).where(eq(quotations.status, "PENDING"));
    const [approved] = await db.select({ count: sql<number>`count(*)` }).from(quotations).where(eq(quotations.status, "APPROVED"));
    const [rejected] = await db.select({ count: sql<number>`count(*)` }).from(quotations).where(eq(quotations.status, "REJECTED"));
    const [expired]  = await db.select({ count: sql<number>`count(*)` }).from(quotations).where(eq(quotations.status, "EXPIRED"));

    // Sum of totals for APPROVED quotations
    const [revenue] = await db
      .select({ sum: sql<number>`coalesce(sum(total), 0)` })
      .from(quotations)
      .where(eq(quotations.status, "APPROVED"));

    return {
      total:    Number(total.count),
      pending:  Number(pending.count),
      approved: Number(approved.count),
      rejected: Number(rejected.count),
      expired:  Number(expired.count),
      revenue:  Number(revenue.sum),
    };
  },

  create: async (data: CreateQuotationDTO) => {
    if (!data.clientName?.trim()) throw new Error("El nombre del cliente es obligatorio.");
    if (!data.clientDocument?.trim()) throw new Error("El documento del cliente es obligatorio.");
    if (!data.items?.length) throw new Error("La cotización debe tener al menos un ítem.");
    if (!data.validUntil) throw new Error("La fecha de validez es obligatoria.");

    const parsedItems = data.items.map((item) => ({
      description: item.description,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      totalPrice:  item.quantity * item.unitPrice,
    }));

    const discount = data.discount ?? 0;
    const tax      = data.tax ?? 18; // default 18% IGV
    const { subtotal, total } = calcTotals(parsedItems, discount, tax);

    const quotationNumber = await nextQuotationNumber();

    const [newQuotation] = await db
      .insert(quotations)
      .values({
        quotationNumber,
        clientId:       data.clientId ?? null,
        clientName:     data.clientName.trim(),
        clientDocument: data.clientDocument.trim(),
        clientPhone:    data.clientPhone?.trim() || null,
        clientEmail:    data.clientEmail?.trim() || null,
        clientAddress:  data.clientAddress?.trim() || null,
        subtotal,
        discount,
        tax,
        total,
        status:      "PENDING",
        validUntil:  new Date(data.validUntil),
        notes:       data.notes?.trim() || null,
      })
      .returning();

    // Insert items
    await db.insert(quotationItems).values(
      parsedItems.map((item) => ({
        quotationId: newQuotation.id,
        ...item,
      }))
    );

    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, newQuotation.id));

    return { ...newQuotation, items };
  },

  update: async (id: number, data: UpdateQuotationDTO) => {
    const [existing] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!existing) throw new Error("Cotización no encontrada.");

    if (data.status && !VALID_STATUSES.includes(data.status)) {
      throw new Error("Estado inválido.");
    }

    const patch: Record<string, any> = { updatedAt: new Date() };

    if (data.clientName     !== undefined) patch.clientName     = data.clientName.trim();
    if (data.clientDocument !== undefined) patch.clientDocument = data.clientDocument.trim();
    if (data.clientPhone    !== undefined) patch.clientPhone    = data.clientPhone?.trim() || null;
    if (data.clientEmail    !== undefined) patch.clientEmail    = data.clientEmail?.trim() || null;
    if (data.clientAddress  !== undefined) patch.clientAddress  = data.clientAddress?.trim() || null;
    if (data.status         !== undefined) patch.status         = data.status;
    if (data.notes          !== undefined) patch.notes          = data.notes?.trim() || null;
    if (data.validUntil     !== undefined) patch.validUntil     = new Date(data.validUntil);

    // Recalculate if items are updated
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
      await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
      await db.insert(quotationItems).values(
        parsedItems.map((item) => ({ quotationId: id, ...item }))
      );
    } else {
      if (data.discount !== undefined) patch.discount = data.discount;
      if (data.tax      !== undefined) patch.tax      = data.tax;
    }

    const [updated] = await db
      .update(quotations)
      .set(patch)
      .where(eq(quotations.id, id))
      .returning();

    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id));

    return { ...updated, items };
  },

  updateStatus: async (id: number, status: string) => {
    if (!VALID_STATUSES.includes(status)) throw new Error("Estado inválido.");

    const [updated] = await db
      .update(quotations)
      .set({ status, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();

    return updated;
  },

  delete: async (id: number) => {
    const [existing] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!existing) throw new Error("Cotización no encontrada.");
    await db.delete(quotations).where(eq(quotations.id, id));
    return existing;
  },
};
