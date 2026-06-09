import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id:          serial("id").primaryKey(),
    name:        text("name").notNull(),
    description: text("description"),
    status:      text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE
    createdAt:   timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      statusIdx: index("categories_status_idx").on(table.status),
    };
  }
);
