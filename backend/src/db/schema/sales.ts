import { pgTable, serial, text, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { quotations } from "./quotations";

export const sales = pgTable(
  "sales",
  {
    id:             serial("id").primaryKey(),
    saleNumber:     text("sale_number").notNull().unique(), // e.g. VEN-0001
    quotationId:    integer("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
    clientId:       integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName:     text("client_name").notNull(),
    clientDocument: text("client_document").notNull(),
    clientPhone:    text("client_phone"),
    clientEmail:    text("client_email"),
    clientAddress:  text("client_address"),
    subtotal:       doublePrecision("subtotal").notNull().default(0),
    discount:       doublePrecision("discount").notNull().default(0),
    tax:            doublePrecision("tax").notNull().default(0), // IGV
    total:          doublePrecision("total").notNull().default(0),
    status:         text("status").notNull().default("PENDIENTE"), // PENDIENTE | A_CUENTA | PAGADA | ANULADA
    paymentMethod:  text("payment_method").notNull().default("EFECTIVO"), // EFECTIVO | TRANSFERENCIA | YAPE | PLIN | TARJETA | MULTIPLE
    paymentDetails: text("payment_details"), // To store split payment breakdown
    advancePayment: doublePrecision("advance_payment").notNull().default(0),
    billingType:    text("billing_type").notNull().default("NOTA_DE_VENTA"), // NOTA_DE_VENTA | BOLETA | FACTURA
    billingNumber:  text("billing_number"), // e.g. B001-0001 or F001-0001
    createdAt:      timestamp("created_at").defaultNow(),
    updatedAt:      timestamp("updated_at").defaultNow(),
  }
);

export const saleItems = pgTable(
  "sale_items",
  {
    id:          serial("id").primaryKey(),
    saleId:      integer("sale_id")
      .references(() => sales.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity:    integer("quantity").notNull().default(1),
    unitPrice:   doublePrecision("unit_price").notNull().default(0),
    totalPrice:  doublePrecision("total_price").notNull().default(0),
    promisedDate: timestamp("promised_date"),
  }
);
