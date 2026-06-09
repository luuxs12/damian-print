import { eq, ilike, inArray } from "drizzle-orm";
import { db } from "../../db";
import { roles, permissions, rolePermissions } from "../../db/schema/roles";
import { sanitize } from "../../utils/string";
/* ── Listar todos los roles con sus permisos ── */
export const getRoles = async () => {
    const allRoles = await db
        .select({
        id: roles.id,
        roleName: roles.roleName,
        description: roles.description,
    })
        .from(roles);
    const allRolePerms = await db
        .select({
        roleId: rolePermissions.roleId,
        permissionCode: permissions.code,
    })
        .from(rolePermissions)
        .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id));
    return allRoles.map((role) => ({
        ...role,
        name: role.roleName,
        permissions: allRolePerms
            .filter((rp) => rp.roleId === role.id && rp.permissionCode)
            .map((rp) => rp.permissionCode),
    }));
};
/* ── Crear rol ── */
export const createRole = async (data) => {
    const name = sanitize(data.name);
    if (!name || name.length < 2)
        throw new Error("El nombre del rol debe tener al menos 2 caracteres.");
    if (name.length > 60)
        throw new Error("El nombre del rol no puede superar los 60 caracteres.");
    /* Bloquear creación de un segundo Administrador */
    if (name.toLowerCase() === "administrador") {
        const [existingAdmin] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(ilike(roles.roleName, "Administrador"));
        if (existingAdmin) {
            throw new Error("Solo puede existir un perfil de Administrador en el sistema. No se puede crear otro.");
        }
    }
    /* Verificar duplicado (case-insensitive) */
    const [existing] = await db.select({ id: roles.id }).from(roles).where(ilike(roles.roleName, name));
    if (existing)
        throw new Error(`Ya existe un rol con el nombre "${name}".`);
    return db.transaction(async (tx) => {
        const [newRole] = await tx
            .insert(roles)
            .values({ roleName: name, description: sanitize(data.description) || null })
            .returning();
        if (data.permissions?.length) {
            const perms = await tx
                .select()
                .from(permissions)
                .where(inArray(permissions.code, data.permissions));
            if (perms.length) {
                await tx.insert(rolePermissions).values(perms.map((p) => ({ roleId: newRole.id, permissionId: p.id })));
            }
        }
        return { ...newRole, name: newRole.roleName, permissions: data.permissions ?? [] };
    });
};
/* ── Actualizar rol ── */
export const updateRole = async (id, data) => {
    const [existing] = await db.select().from(roles).where(eq(roles.id, id));
    if (!existing)
        throw new Error("Rol no encontrado.");
    if (existing.roleName.toLowerCase() === "administrador") {
        const adminRoles = await db
            .select({ id: roles.id })
            .from(roles)
            .where(ilike(roles.roleName, "Administrador"));
        adminRoles.sort((a, b) => a.id - b.id);
        if (adminRoles.length === 0 || adminRoles[0].id === id) {
            throw new Error("El rol de Administrador es del sistema y no se puede modificar.");
        }
    }
    const name = data.name !== undefined ? sanitize(data.name) : undefined;
    if (name !== undefined) {
        if (!name || name.length < 2)
            throw new Error("El nombre del rol debe tener al menos 2 caracteres.");
        if (name.length > 60)
            throw new Error("El nombre del rol no puede superar los 60 caracteres.");
        /* Verificar duplicado excluyendo el propio rol */
        const [dup] = await db.select({ id: roles.id }).from(roles).where(ilike(roles.roleName, name));
        if (dup && dup.id !== id)
            throw new Error(`Ya existe otro rol con el nombre "${name}".`);
    }
    return db.transaction(async (tx) => {
        const [updatedRole] = await tx
            .update(roles)
            .set({
            ...(name !== undefined && { roleName: name }),
            ...(data.description !== undefined && { description: sanitize(data.description) || null }),
        })
            .where(eq(roles.id, id))
            .returning();
        /* Reemplazar permisos solo si se envían en el body */
        if (data.permissions !== undefined) {
            await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
            if (data.permissions.length) {
                const perms = await tx
                    .select()
                    .from(permissions)
                    .where(inArray(permissions.code, data.permissions));
                if (perms.length) {
                    await tx.insert(rolePermissions).values(perms.map((p) => ({ roleId: id, permissionId: p.id })));
                }
            }
        }
        return { ...updatedRole, name: updatedRole.roleName, permissions: data.permissions ?? [] };
    });
};
/* ── Eliminar rol ── */
export const deleteRole = async (id) => {
    const [existing] = await db.select().from(roles).where(eq(roles.id, id));
    if (!existing)
        throw new Error("Rol no encontrado o ya fue eliminado.");
    if (existing.roleName.toLowerCase() === "administrador") {
        const adminRoles = await db
            .select({ id: roles.id })
            .from(roles)
            .where(ilike(roles.roleName, "Administrador"));
        adminRoles.sort((a, b) => a.id - b.id);
        if (adminRoles.length === 0 || adminRoles[0].id === id) {
            throw new Error("El rol de Administrador es del sistema y no se puede eliminar.");
        }
    }
    /* Drizzle elimina automáticamente los rolePermissions si hay CASCADE en el schema */
    await db.delete(roles).where(eq(roles.id, id));
    return existing;
};
