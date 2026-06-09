import { eq, ne, sql } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema/users";
import { roles, permissions, rolePermissions } from "../../db/schema/roles";
import { categories } from "../../db/schema/categories";
import { products } from "../../db/schema/products";
import { presentations } from "../../db/schema/presentations";
import { presentationSupplies, supplies } from "../../db/schema/supplies";
import { productionOrders } from "../../db/schema/production";
import { clients } from "../../db/schema/clients";
import { auditLogs } from "../../db/schema/audit-logs";
import { settings } from "../../db/schema/settings";
import { quotations, quotationItems } from "../../db/schema/quotations";
import type { UpdateSettingsDTO } from "./settings.types";

export const getSettings = async () => {
  const [existing] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!existing) {
    // Seed default settings row if it was deleted
    const [row] = await db
      .insert(settings)
      .values({
        id: 1,
        companyName: "Damian Print",
        companyRuc: "20123456789",
        companyEmail: "contacto@damianprint.com",
        companyPhone: "987654321",
        companyAddress: "Av. Larco 123, Miraflores",
      })
      .returning();
    return row;
  }
  return existing;
};

export const updateSettings = async (data: UpdateSettingsDTO) => {
  // Ensure default settings row exists
  await getSettings();

  const [updated] = await db
    .update(settings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(settings.id, 1))
    .returning();

  return updated;
};

export const getBackupData = async () => {
  const usersList              = await db.select().from(users);
  const rolesList              = await db.select().from(roles);
  const permissionsList        = await db.select().from(permissions);
  const rolePermissionsList    = await db.select().from(rolePermissions);
  const categoriesList         = await db.select().from(categories);
  const productsList           = await db.select().from(products);
  const presentationsList      = await db.select().from(presentations);
  const presentationSuppliesList = await db.select().from(presentationSupplies);
  const suppliesList           = await db.select().from(supplies);
  const productionOrdersList   = await db.select().from(productionOrders);
  const clientsList            = await db.select().from(clients);
  const quotationsList         = await db.select().from(quotations);
  const quotationItemsList     = await db.select().from(quotationItems);
  const auditLogsList          = await db.select().from(auditLogs);
  const settingsList           = await db.select().from(settings);

  return {
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    tables: {
      permissions:          permissionsList,
      roles:                rolesList,
      rolePermissions:      rolePermissionsList,
      users:                usersList,
      categories:           categoriesList,
      supplies:             suppliesList,
      products:             productsList,
      presentations:        presentationsList,
      presentationSupplies: presentationSuppliesList,
      productionOrders:     productionOrdersList,
      clients:              clientsList,
      quotations:           quotationsList,
      quotationItems:       quotationItemsList,
      auditLogs:            auditLogsList,
      settings:             settingsList,
    }
  };
};

/* ─────────────────────────────────────────────────────────────────────────
   Helper: convierte strings ISO en Date para los campos timestamp del backup
───────────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normTimestamps = (rows: any[], ...fields: string[]): any[] =>
  rows.map((row) => {
    const copy: any = { ...row };
    for (const f of fields) {
      if (copy[f] !== undefined) copy[f] = copy[f] ? new Date(copy[f]) : null;
    }
    return copy;
  });

/* ─────────────────────────────────────────────────────────────────────────
   Helper: resetea las secuencias serial de PostgreSQL al máximo id actual
   para que los futuros INSERTs no colisionen.
───────────────────────────────────────────────────────────────────────── */
const resetSequence = async (tableName: string, idCol = "id") => {
  await db.execute(
    sql.raw(`SELECT setval(pg_get_serial_sequence('${tableName}', '${idCol}'), COALESCE(MAX(${idCol}), 0) + 1, false) FROM "${tableName}"`) 
  );
};

export const restoreBackupData = async (backupData: any) => {
  if (!backupData || typeof backupData !== "object" || !backupData.tables) {
    throw new Error("Formato de backup inválido.");
  }

  const t = backupData.tables;

  await db.transaction(async (tx) => {
    /* ── 1. Borrar en orden inverso de FK ── */
    await tx.execute(sql.raw(`DELETE FROM "quotation_items"`));
    await tx.execute(sql.raw(`DELETE FROM "quotations"`));
    await tx.execute(sql.raw(`DELETE FROM "production_orders"`));
    await tx.execute(sql.raw(`DELETE FROM "presentation_supplies"`));
    await tx.execute(sql.raw(`DELETE FROM "presentations"`));
    await tx.execute(sql.raw(`DELETE FROM "products"`));
    await tx.execute(sql.raw(`DELETE FROM "supplies"`));
    await tx.execute(sql.raw(`DELETE FROM "clients"`));
    await tx.execute(sql.raw(`DELETE FROM "categories"`));
    await tx.execute(sql.raw(`DELETE FROM "audit_logs"`));
    await tx.execute(sql.raw(`DELETE FROM "settings"`));
    await tx.execute(sql.raw(`DELETE FROM "role_permissions"`));
    await tx.execute(sql.raw(`DELETE FROM "users"`));
    await tx.execute(sql.raw(`DELETE FROM "roles"`));
    await tx.execute(sql.raw(`DELETE FROM "permissions"`));

    /* ── 2. Restaurar en orden de FK ── */

    // Permissions
    if (t.permissions?.length) {
      await tx.insert(permissions).values(
        normTimestamps(t.permissions)
      );
    }

    // Roles
    if (t.roles?.length) {
      await tx.insert(roles).values(
        normTimestamps(t.roles)
      );
    }

    // Role-permission pivot
    if (t.rolePermissions?.length) {
      await tx.insert(rolePermissions).values(
        normTimestamps(t.rolePermissions)
      );
    }

    // Users
    if (t.users?.length) {
      await tx.insert(users).values(
        normTimestamps(t.users, "createdAt")
      );
    }

    // Categories
    if (t.categories?.length) {
      await tx.insert(categories).values(
        normTimestamps(t.categories, "createdAt", "updatedAt")
      );
    }

    // Supplies
    if (t.supplies?.length) {
      await tx.insert(supplies).values(
        normTimestamps(t.supplies, "createdAt", "updatedAt")
      );
    }

    // Products
    if (t.products?.length) {
      await tx.insert(products).values(
        normTimestamps(t.products, "createdAt", "updatedAt")
      );
    }

    // Presentations
    if (t.presentations?.length) {
      await tx.insert(presentations).values(
        normTimestamps(t.presentations, "createdAt", "updatedAt")
      );
    }

    // Presentation-Supplies pivot
    if (t.presentationSupplies?.length) {
      await tx.insert(presentationSupplies).values(
        normTimestamps(t.presentationSupplies)
      );
    }

    // Production Orders
    if (t.productionOrders?.length) {
      await tx.insert(productionOrders).values(
        normTimestamps(t.productionOrders, "createdAt", "updatedAt", "completedAt")
      );
    }

    // Clients
    if (t.clients?.length) {
      await tx.insert(clients).values(
        normTimestamps(t.clients, "createdAt", "updatedAt")
      );
    }

    // Quotations
    if (t.quotations?.length) {
      await tx.insert(quotations).values(
        normTimestamps(t.quotations, "validUntil", "createdAt", "updatedAt")
      );
    }

    // Quotation Items
    if (t.quotationItems?.length) {
      await tx.insert(quotationItems).values(
        normTimestamps(t.quotationItems)
      );
    }

    // Audit Logs
    if (t.auditLogs?.length) {
      await tx.insert(auditLogs).values(
        normTimestamps(t.auditLogs, "createdAt")
      );
    }

    // Settings
    if (t.settings?.length) {
      await tx.insert(settings).values(
        normTimestamps(t.settings, "createdAt", "updatedAt")
      );
    }
  });

  /* ── 3. Resetear secuencias para que los futuros INSERT no fallen ── */
  await resetSequence("permissions");
  await resetSequence("roles");
  await resetSequence("role_permissions");
  await resetSequence("users");
  await resetSequence("categories");
  await resetSequence("supplies");
  await resetSequence("presentation_supplies");
  await resetSequence("products");
  await resetSequence("presentations");
  await resetSequence("production_orders");
  await resetSequence("clients");
  await resetSequence("quotations");
  await resetSequence("quotation_items");
  await resetSequence("audit_logs");
};

export const resetDatabase = async () => {
  await db.transaction(async (tx) => {
    // ── 1. Datos operativos: cotizaciones ─────────────────────────────
    await tx.delete(quotationItems);
    await tx.delete(quotations);

    // ── 2. Producción y presentaciones ───────────────────────────────
    await tx.delete(productionOrders);
    await tx.delete(presentationSupplies);
    await tx.delete(presentations);

    // ── 3. Catálogo ──────────────────────────────────────────────────
    await tx.delete(products);
    await tx.delete(supplies);
    await tx.delete(clients);
    await tx.delete(categories);

    // ── 4. Usuarios: borrar TODOS excepto el Administrador ────────────
    //    El usuario con role 'Administrador' es fundamental para el sistema.
    await tx.delete(users).where(ne(users.role, "Administrador"));

    // ── 5. Roles/permisos: conservar el rol Administrador ─────────────
    //    Solo se borran roles que NO se llamen 'Administrador'.
    //    rolePermissions se borra en cascada desde roles, así que
    //    únicamente eliminamos los roles no-administrador.
    const adminRoles = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.roleName, "Administrador"));
    const adminRoleIds = adminRoles.map((r) => r.id);

    // Borrar rolePermissions de roles que NO son Administrador
    for (const row of await tx.select().from(roles)) {
      if (!adminRoleIds.includes(row.id)) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, row.id));
      }
    }
    // Borrar roles no-administrador
    await tx.delete(roles).where(ne(roles.roleName, "Administrador"));

    // ── 6. Logs de auditoría ─────────────────────────────────────────
    await tx.delete(auditLogs);
  });
};
