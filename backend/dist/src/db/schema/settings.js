import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
export const settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    companyName: text("company_name").notNull().default("Damian Print"),
    companyRuc: text("company_ruc").notNull().default(""),
    companyEmail: text("company_email").notNull().default(""),
    companyPhone: text("company_phone").notNull().default(""),
    companyAddress: text("company_address").notNull().default(""),
    systemLogo: text("system_logo"),
    yapeQr: text("yape_qr"),
    plinQr: text("plin_qr"),
    updatedAt: timestamp("updated_at").defaultNow(),
});
