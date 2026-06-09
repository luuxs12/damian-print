import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull(),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      usernameIdx: index("users_username_idx").on(table.username),
      statusIdx: index("users_status_idx").on(table.status),
    };
  }
);