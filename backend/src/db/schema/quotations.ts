import { pgTable, serial, text, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { clients } from "./clients";

export const quotations = pgTable(
  "quotations",
  {
    id:              serial("id").primaryKey(),
    quotationNumber: text("quotation_number").notNull().unique(), // e.g. COT-0001
    clientId:        integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName:      text("client_name").notNull(),
    clientDocument:  text("client_document").notNull(),
    clientPhone:     text("client_phone"),
    clientEmail:     text("client_email"),
    clientAddress:   text("client_address"),
    subtotal:        doublePrecision("subtotal").notNull().default(0),
    discount:        doublePrecision("discount").notNull().default(0),
    tax:             doublePrecision("tax").notNull().default(0), // IGV (18%)
    total:           doublePrecision("total").notNull().default(0),
    status:          text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED | EXPIRED
    validUntil:      timestamp("valid_until").notNull(),
    notes:           text("notes"),
    createdAt:       timestamp("created_at").defaultNow(),
    updatedAt:       timestamp("updated_at").defaultNow(),
  }
);

export const quotationItems = pgTable(
  "quotation_items",
  {
    id:          serial("id").primaryKey(),
    quotationId: integer("quotation_id")
      .references(() => quotations.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity:    integer("quantity").notNull().default(1),
    unitPrice:   doublePrecision("unit_price").notNull().default(0),
    totalPrice:  doublePrecision("total_price").notNull().default(0),
    promisedDate: timestamp("promised_date"),
  }
);
