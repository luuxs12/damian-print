import { eq, ilike } from "drizzle-orm";
import { db }         from "../../db";
import { supplies }   from "../../db/schema/supplies";
import { sanitize }   from "../../utils/string";
import type { CreateSupplyDTO, UpdateSupplyDTO } from "./supplies.types";

/* ── Helpers internos ── */

/** Verifica si ya existe un insumo con ese código (case-insensitive),
 *  excluyendo opcionalmente un ID para el caso de edición. */
const codeExists = async (code: string, excludeId?: number) => {
  const [found] = await db
    .select({ id: supplies.id })
    .from(supplies)
    .where(ilike(supplies.code, code));

  if (!found) return false;
  if (excludeId !== undefined && found.id === excludeId) return false;
  return true;
};

/* ── Listar todos ── */
export const getSupplies = async () => {
  return db
    .select({
      id:          supplies.id,
      code:        supplies.code,
      name:        supplies.name,
      description: supplies.description,
      stock:       supplies.stock,
      minStock:    supplies.minStock,
      unit:        supplies.unit,
      cost:        supplies.cost,
      status:      supplies.status,
      createdAt:   supplies.createdAt,
    })
    .from(supplies)
    .orderBy(supplies.createdAt);
};

/* ── Crear ── */
export const createSupply = async (data: CreateSupplyDTO) => {
  const code        = sanitize(data.code)?.toUpperCase();
  const name        = sanitize(data.name);
  const description = sanitize(data.description);
  const unit        = sanitize(data.unit);
  const stock       = Number(data.stock) || 0;
  const minStock    = Number(data.minStock) || 0;
  const cost        = Number(data.cost) || 0;

  if (!code) throw new Error("El código del insumo es obligatorio.");
  if (!name) throw new Error("El nombre del insumo es obligatorio.");
  if (!unit) throw new Error("La unidad de medida es obligatoria.");
  if (stock < 0) throw new Error("El stock inicial no puede ser negativo.");
  if (minStock < 0) throw new Error("El stock mínimo no puede ser negativo.");
  if (cost < 0) throw new Error("El costo unitario no puede ser negativo.");

  if (await codeExists(code)) {
    throw new Error(`Ya existe un insumo con el código "${code}".`);
  }

  const [supply] = await db
    .insert(supplies)
    .values({
      code,
      name,
      description: description || null,
      stock,
      minStock,
      unit,
      cost,
      status: "ACTIVE",
    })
    .returning();

  return supply;
};

/* ── Actualizar ── */
export const updateSupply = async (id: number, data: UpdateSupplyDTO) => {
  const [existing] = await db.select().from(supplies).where(eq(supplies.id, id));
  if (!existing) throw new Error("Insumo no encontrado.");

  const code        = data.code        !== undefined ? sanitize(data.code)?.toUpperCase() : undefined;
  const name        = data.name        !== undefined ? sanitize(data.name)                : undefined;
  const description = data.description !== undefined ? sanitize(data.description)         : undefined;
  const unit        = data.unit        !== undefined ? sanitize(data.unit)                : undefined;
  const stock       = data.stock       !== undefined ? Number(data.stock)                 : undefined;
  const minStock    = data.minStock    !== undefined ? Number(data.minStock)              : undefined;
  const cost        = data.cost        !== undefined ? Number(data.cost)                  : undefined;

  if (code !== undefined) {
    if (!code) throw new Error("El código no puede estar vacío.");
    if (await codeExists(code, id)) {
      throw new Error(`Ya existe otro insumo con el código "${code}".`);
    }
  }

  if (name !== undefined && !name) throw new Error("El nombre no puede estar vacío.");
  if (unit !== undefined && !unit) throw new Error("La unidad de medida no puede estar vacía.");
  if (stock !== undefined && stock < 0) throw new Error("El stock no puede ser negativo.");
  if (minStock !== undefined && minStock < 0) throw new Error("El stock mínimo no puede ser negativo.");
  if (cost !== undefined && cost < 0) throw new Error("El costo no puede ser negativo.");

  const patch: Record<string, unknown> = {};
  if (code        !== undefined) patch.code        = code;
  if (name        !== undefined) patch.name        = name;
  if (description !== undefined) patch.description = description || null;
  if (unit        !== undefined) patch.unit        = unit;
  if (stock       !== undefined) patch.stock       = stock;
  if (minStock    !== undefined) patch.minStock    = minStock;
  if (cost        !== undefined) patch.cost        = cost;

  if (data.status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
      throw new Error("Estado inválido. Usa ACTIVE o INACTIVE.");
    }
    patch.status = data.status;
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("No se enviaron campos para actualizar.");
  }

  const [updated] = await db
    .update(supplies)
    .set(patch)
    .where(eq(supplies.id, id))
    .returning();

  return updated;
};

/* ── Alternar estado ── */
export const toggleSupplyStatus = async (id: number) => {
  const [existing] = await db.select().from(supplies).where(eq(supplies.id, id));
  if (!existing) throw new Error("Insumo no encontrado.");

  const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const [updated] = await db
    .update(supplies)
    .set({ status: newStatus })
    .where(eq(supplies.id, id))
    .returning();

  return updated;
};

/* ── Eliminar ── */
export const deleteSupply = async (id: number) => {
  const [existing] = await db.select().from(supplies).where(eq(supplies.id, id));
  if (!existing) throw new Error("Insumo no encontrado o ya fue eliminado.");

  await db.delete(supplies).where(eq(supplies.id, id));
  return existing;
};
