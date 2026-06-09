import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { productionOrders } from "../../db/schema/production";
import type { CreateProductionOrderDTO, UpdateProductionOrderDTO } from "./production.types";

export const productionService = {
  getProductionOrders: async () => {
    return db
      .select()
      .from(productionOrders)
      .orderBy(desc(productionOrders.createdAt));
  },

  createProductionOrder: async (data: CreateProductionOrderDTO) => {
    // Generate order number if not provided
    let orderNumber = data.orderNumber;
    if (!orderNumber) {
      const count = await db.select({ id: productionOrders.id }).from(productionOrders);
      orderNumber = `OP-${String(count.length + 1).padStart(4, "0")}`;
    }

    const [newOrder] = await db
      .insert(productionOrders)
      .values({
        orderNumber,
        productId: data.productId || null,
        productName: data.productName,
        clientName: data.clientName,
        quantity: data.quantity,
        branchName: data.branchName || "Local Principal",
        status: data.status || "PENDING",
        promisedDate: new Date(data.promisedDate),
        notes: data.notes || null,
      })
      .returning();

    return newOrder;
  },

  updateProductionOrder: async (id: number, data: UpdateProductionOrderDTO) => {
    const patch: Record<string, any> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.branchName !== undefined) patch.branchName = data.branchName;
    if (data.promisedDate !== undefined) patch.promisedDate = new Date(data.promisedDate);
    if (data.notes !== undefined) patch.notes = data.notes;

    const [updated] = await db
      .update(productionOrders)
      .set(patch)
      .where(eq(productionOrders.id, id))
      .returning();

    return updated;
  },

  deleteProductionOrder: async (id: number) => {
    const [deleted] = await db
      .delete(productionOrders)
      .where(eq(productionOrders.id, id))
      .returning();

    return deleted;
  },
};
