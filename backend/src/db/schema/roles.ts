import { pgTable, serial, varchar, text, integer, index } from "drizzle-orm/pg-core";

/* Tabla de roles del sistema */
export const roles = pgTable("roles", {
  id:          serial("id").primaryKey(),
  roleName:    varchar("role_name", { length: 100 }).notNull(),
  description: text("description"),
});

/* Catálogo de permisos disponibles (codes únicos) */
export const permissions = pgTable("permissions", {
  id:          serial("id").primaryKey(),
  code:        varchar("code", { length: 100 }).notNull().unique(),
  description: text("description"),
});

/* Tabla pivote rol ↔ permiso con eliminación en cascada */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id:           serial("id").primaryKey(),
    roleId:       integer("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    permissionId: integer("permission_id")
      .references(() => permissions.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => {
    return {
      roleIdIdx: index("role_permissions_role_id_idx").on(table.roleId),
      permissionIdIdx: index("role_permissions_permission_id_idx").on(table.permissionId),
    };
  }
);