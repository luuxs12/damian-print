import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const passwordResets = pgTable(
  "password_resets",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      emailIdx: index("password_resets_email_idx").on(table.email),
      codeIdx: index("password_resets_code_idx").on(table.code),
    };
  }
);
