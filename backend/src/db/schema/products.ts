import { pgTable, serial, text, timestamp, integer, doublePrecision, index, boolean, jsonb } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { users } from "./users";

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    unit: text("unit").notNull().default("Pieza"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE
    type: text("type").notNull().default("FINISHED_PRODUCT"), // FINISHED_PRODUCT | MATERIAL | SERVICE
    imageUrl: text("image_url"),
    createdById: integer("created_by_id")
      .references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),

    // Characteristics
    manageInventory: boolean("manage_inventory").notNull().default(false),
    countAsPrint: boolean("count_as_print").notNull().default(false),
    sendToProduction: boolean("send_to_production").notNull().default(false),
    branchName: text("branch_name"),

    // Advanced Pricing
    pricePublic: doublePrecision("price_public").notNull().default(0.0),
    priceReseller: doublePrecision("price_reseller").notNull().default(0.0),
    priceScales: jsonb("price_scales"),
    specialPrices: jsonb("special_prices"),
    
    // Costs & Materials
    laborCost: doublePrecision("labor_cost").notNull().default(0.0),
    overheadCost: doublePrecision("overhead_cost").notNull().default(0.0),
    materials: jsonb("materials"),
  },
  (table) => {
    return {
      categoryIdIdx: index("products_category_id_idx").on(table.categoryId),
      createdByIdIdx: index("products_created_by_id_idx").on(table.createdById),
      statusIdx: index("products_status_idx").on(table.status),
    };
  }
);

export const productPresentations = pgTable(
  "product_presentations",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    presentation: text("presentation").notNull(), // e.g., "100 und"
    price: doublePrecision("price").notNull(), // e.g., 25.0
  },
  (table) => {
    return {
      productIdIdx: index("product_presentations_product_id_idx").on(table.productId),
    };
  }
);
