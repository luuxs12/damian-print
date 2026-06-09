import { pgTable, serial, text, timestamp, integer, doublePrecision, index } from "drizzle-orm/pg-core";
import { products } from "./products";
export const presentations = pgTable("presentations", {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    size: text("size"),
    material: text("material"),
    finish: text("finish"),
    color: text("color"),
    quantity: text("quantity"),
    imageUrl: text("image_url"),
    cost: doublePrecision("cost").notNull().default(0),
    price: doublePrecision("price").notNull().default(0),
    wholesalePrice: doublePrecision("wholesale_price").notNull().default(0),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
    return {
        productIdIdx: index("presentations_product_id_idx").on(table.productId),
        statusIdx: index("presentations_status_idx").on(table.status),
    };
});
