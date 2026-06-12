import { eq, and, sql, gte, lte } from "drizzle-orm";
import { db } from "../../db";
import { sales } from "../../db/schema/sales";
import { productionOrders } from "../../db/schema/production";

export const dashboardService = {
  getStats: async (startDate?: Date, endDate?: Date) => {
    // 1. Calculate revenue from paid sales
    const salesConditions = [sql`${sales.status} IN ('PAGADA', 'A_CUENTA')`];
    if (startDate && endDate) {
      salesConditions.push(gte(sales.createdAt, startDate));
      salesConditions.push(lte(sales.createdAt, endDate));
    }

    const [salesStat] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CASE WHEN ${sales.status} = 'A_CUENTA' THEN ${sales.advancePayment} ELSE ${sales.total} END), 0)`,
        count: sql<number>`COALESCE(COUNT(${sales.id}), 0)`
      })
      .from(sales)
      .where(and(...salesConditions));

    // 2. Count production orders
    // PENDING, DESIGN, PRINTING, FINISHING count as pending / works in progress
    const [pendingCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(productionOrders)
      .where(sql`${productionOrders.status} IN ('PENDING', 'DESIGN', 'PRINTING', 'FINISHING')`);

    // DELIVERED count as completed deliveries
    const [completedCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(productionOrders)
      .where(eq(productionOrders.status, "DELIVERED"));

    // READY count as waiting deliveries
    const [waitingCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(productionOrders)
      .where(eq(productionOrders.status, "READY"));

    // 3. Build chart points (group by date)
    // We group sales total and count by date of creation
    const chartConditions = [];
    if (startDate && endDate) {
      chartConditions.push(gte(sales.createdAt, startDate));
      chartConditions.push(lte(sales.createdAt, endDate));
    }

    const chartPoints = await db
      .select({
        dateStr: sql<string>`TO_CHAR(${sales.createdAt}, 'DD/MM')`,
        dayOfWeek: sql<string>`TO_CHAR(${sales.createdAt}, 'Dy')`,
        ingresos: sql<number>`COALESCE(SUM(CASE WHEN ${sales.status} = 'A_CUENTA' THEN ${sales.advancePayment} ELSE ${sales.total} END), 0)`,
        pedidos: sql<number>`COALESCE(COUNT(${sales.id}), 0)`
      })
      .from(sales)
      .where(chartConditions.length > 0 ? and(...chartConditions) : undefined)
      .groupBy(sql`TO_CHAR(${sales.createdAt}, 'DD/MM')`, sql`TO_CHAR(${sales.createdAt}, 'Dy')`)
      .orderBy(sql`TO_CHAR(${sales.createdAt}, 'DD/MM')`);

    // 4. Production summary breakdown
    const [cancelledCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(productionOrders)
      .where(eq(productionOrders.status, "ANULADA" as any)); // fallback or just 0

    return {
      kpis: {
        ingresos: Number(salesStat?.total || 0),
        pedidos: Number(salesStat?.count || 0),
        entregas: Number(completedCountResult?.count || 0),
        enEspera: Number(waitingCountResult?.count || 0),
      },
      chartData: chartPoints.map((p) => ({
        label: p.dateStr,
        ingresos: Number(p.ingresos),
        pedidos: Number(p.pedidos)
      })),
      breakdown: {
        completados: Number(completedCountResult?.count || 0),
        cancelados: Number(cancelledCountResult?.count || 0),
        clientes: Number(salesStat?.count || 0), // estimation
        productos: Number(pendingCountResult?.count || 0),
      }
    };
  }
};
