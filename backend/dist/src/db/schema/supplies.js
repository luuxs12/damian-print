import { pgTable, serial, text, timestamp, integer, doublePrecision, index } from "drizzle-orm/pg-core";
import { presentations } from "./presentations";
export const supplies = pgTable("supplies", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    stock: doublePrecision("stock").notNull().default(0),
    minStock: doublePrecision("min_stock").notNull().default(0),
    unit: text("unit").notNull(), // e.g. "m2", "und", "resma", "l"
    cost: doublePrecision("cost").notNull().default(0), // cost per unit
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE
    createdAt: timestamp("created_at").defaultNow(),
});
export const presentationSupplies = pgTable("presentation_supplies", {
    id: serial("id").primaryKey(),
    presentationId: integer("presentation_id")
        .notNull()
        .references(() => presentations.id, { onDelete: "cascade" }),
    supplyId: integer("supply_id")
        .notNull()
        .references(() => supplies.id, { onDelete: "cascade" }),
    quantity: doublePrecision("quantity").notNull(), // quantity of supply consumed per unit of presentation
}, (table) => {
    return {
        presentationIdIdx: index("presentation_supplies_presentation_id_idx").on(table.presentationId),
        supplyIdIdx: index("presentation_supplies_supply_id_idx").on(table.supplyId),
    };
});
