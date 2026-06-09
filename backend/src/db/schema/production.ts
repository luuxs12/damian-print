import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { products } from "./products";

export const productionOrders = pgTable(
  "production_orders",
  {
    id:           serial("id").primaryKey(),
    orderNumber:  text("order_number").notNull().unique(),
    productId:    integer("product_id")
      .references(() => products.id, { onDelete: "set null" }),
    productName:  text("product_name").notNull(),
    clientName:   text("client_name").notNull(),
    quantity:     integer("quantity").notNull().default(1),
    branchName:   text("branch_name").notNull().default("Taller Principal"),
    status:       text("status").notNull().default("PENDING"), // PENDING | DESIGN | PRINTING | FINISHING | READY | DELIVERED
    promisedDate: timestamp("promised_date").notNull(),
    notes:        text("notes"),
    createdAt:    timestamp("created_at").defaultNow(),
  }
);
