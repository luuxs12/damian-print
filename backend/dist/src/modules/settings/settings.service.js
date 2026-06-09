import { eq } from "drizzle-orm";
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
export const updateSettings = async (data) => {
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
    const usersList = await db.select().from(users);
    const rolesList = await db.select().from(roles);
    const permissionsList = await db.select().from(permissions);
    const rolePermissionsList = await db.select().from(rolePermissions);
    const categoriesList = await db.select().from(categories);
    const productsList = await db.select().from(products);
    const presentationsList = await db.select().from(presentations);
    const presentationSuppliesList = await db.select().from(presentationSupplies);
    const suppliesList = await db.select().from(supplies);
    const productionOrdersList = await db.select().from(productionOrders);
    const clientsList = await db.select().from(clients);
    const auditLogsList = await db.select().from(auditLogs);
    const settingsList = await db.select().from(settings);
    return {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        tables: {
            users: usersList,
            roles: rolesList,
            permissions: permissionsList,
            rolePermissions: rolePermissionsList,
            categories: categoriesList,
            products: productsList,
            presentations: presentationsList,
            presentationSupplies: presentationSuppliesList,
            supplies: suppliesList,
            productionOrders: productionOrdersList,
            clients: clientsList,
            auditLogs: auditLogsList,
            settings: settingsList,
        }
    };
};
export const restoreBackupData = async (backupData) => {
    if (!backupData || typeof backupData !== "object" || !backupData.tables) {
        throw new Error("Formato de backup inválido.");
    }
    await db.transaction(async (tx) => {
        // Delete in reverse order of foreign keys
        await tx.delete(productionOrders);
        await tx.delete(presentationSupplies);
        await tx.delete(presentations);
        await tx.delete(products);
        await tx.delete(supplies);
        await tx.delete(clients);
        await tx.delete(categories);
        await tx.delete(auditLogs);
        await tx.delete(settings);
        await tx.delete(rolePermissions);
        await tx.delete(users);
        await tx.delete(roles);
        await tx.delete(permissions);
        const tables = backupData.tables;
        // Insert permissions
        if (tables.permissions?.length) {
            await tx.insert(permissions).values(tables.permissions);
        }
        // Insert roles
        if (tables.roles?.length) {
            await tx.insert(roles).values(tables.roles);
        }
        // Insert rolePermissions
        if (tables.rolePermissions?.length) {
            await tx.insert(rolePermissions).values(tables.rolePermissions);
        }
        // Insert users
        if (tables.users?.length) {
            await tx.insert(users).values(tables.users);
        }
        // Insert categories
        if (tables.categories?.length) {
            await tx.insert(categories).values(tables.categories);
        }
        // Insert products
        if (tables.products?.length) {
            await tx.insert(products).values(tables.products);
        }
        // Insert presentations
        if (tables.presentations?.length) {
            await tx.insert(presentations).values(tables.presentations);
        }
        // Insert supplies
        if (tables.supplies?.length) {
            await tx.insert(supplies).values(tables.supplies);
        }
        // Insert presentationSupplies
        if (tables.presentationSupplies?.length) {
            await tx.insert(presentationSupplies).values(tables.presentationSupplies);
        }
        // Insert productionOrders
        if (tables.productionOrders?.length) {
            await tx.insert(productionOrders).values(tables.productionOrders);
        }
        // Insert clients
        if (tables.clients?.length) {
            await tx.insert(clients).values(tables.clients);
        }
        // Insert auditLogs
        if (tables.auditLogs?.length) {
            await tx.insert(auditLogs).values(tables.auditLogs);
        }
        // Insert settings
        if (tables.settings?.length) {
            await tx.insert(settings).values(tables.settings);
        }
    });
};
export const resetDatabase = async () => {
    await db.transaction(async (tx) => {
        // Truncate operational tables in correct order
        await tx.delete(productionOrders);
        await tx.delete(presentationSupplies);
        await tx.delete(presentations);
        await tx.delete(products);
        await tx.delete(supplies);
        await tx.delete(clients);
        await tx.delete(categories);
        await tx.delete(auditLogs);
    });
};
