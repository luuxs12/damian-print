import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const clients = pgTable(
  "clients",
  {
    id:           serial("id").primaryKey(),
    // Tipo de cliente: empresa o particular
    type:         text("type").notNull().default("PARTICULAR"), // EMPRESA | PARTICULAR
    // Datos personales / empresa
    name:         text("name").notNull(),
    documentType: text("document_type").notNull().default("DNI"), // DNI | RUC | CE | PASAPORTE
    document:     text("document").notNull().unique(),
    phone:        text("phone"),
    email:        text("email"),
    address:      text("address"),
    city:         text("city"),
    // Datos adicionales
    contactName:  text("contact_name"),   // Para empresas: nombre del contacto
    notes:        text("notes"),
    status:       text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE
    createdAt:    timestamp("created_at").defaultNow(),
    updatedAt:    timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    nameIdx:     index("clients_name_idx").on(table.name),
    documentIdx: index("clients_document_idx").on(table.document),
    statusIdx:   index("clients_status_idx").on(table.status),
    typeIdx:     index("clients_type_idx").on(table.type),
  })
);
