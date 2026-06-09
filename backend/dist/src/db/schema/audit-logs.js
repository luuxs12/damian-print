import { pgTable, serial, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
export const auditLogs = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    username: text("username").notNull(),
    module: text("module").notNull(),
    action: text("action").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
        moduleIdx: index("audit_logs_module_idx").on(table.module),
        actionIdx: index("audit_logs_action_idx").on(table.action),
        createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    };
});
