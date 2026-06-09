import { eq, ilike, sql } from "drizzle-orm";
import { db }         from "../../db";
import { categories } from "../../db/schema/categories";
import { products }   from "../../db/schema/products";
import { sanitize }   from "../../utils/string";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "./categories.types";

/* ── Helpers internos ── */

/** Verifica si ya existe una categoría con ese nombre (case-insensitive),
 *  excluyendo opcionalmente un ID para el caso de edición. */
const nameExists = async (name: string, excludeId?: number) => {
  const [found] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(ilike(categories.name, name));

  if (!found) return false;
  if (excludeId !== undefined && found.id === excludeId) return false;
  return true;
};

/* ── Listar todas ── */
export const getCategories = async () => {
  return db
    .select({
      id:          categories.id,
      name:        categories.name,
      description: categories.description,
      status:      categories.status,
      createdAt:   categories.createdAt,
      productsCount: sql<number>`(
        SELECT count(*)::int FROM products
        WHERE products.category_id = categories.id
      )`,
    })
    .from(categories)
    .orderBy(categories.createdAt);
};

/* ── Crear ── */
export const createCategory = async (data: CreateCategoryDTO) => {

  const name        = sanitize(data.name);
  const description = sanitize(data.description);

  if (!name) throw new Error("El nombre de la categoría es obligatorio.");
  if (name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");
  if (name.length > 80) throw new Error("El nombre no puede superar los 80 caracteres.");

  if (await nameExists(name)) {
    throw new Error(`Ya existe una categoría con el nombre "${name}".`);
  }

  const [category] = await db
    .insert(categories)
    .values({ name, description: description || null, status: "ACTIVE" })
    .returning();

  return category;
};

/* ── Actualizar ── */
export const updateCategory = async (id: number, data: UpdateCategoryDTO) => {

  const [existing] = await db.select().from(categories).where(eq(categories.id, id));
  if (!existing) throw new Error("Categoría no encontrada.");

  const name        = data.name        !== undefined ? sanitize(data.name)        : undefined;
  const description = data.description !== undefined ? sanitize(data.description) : undefined;

  if (name !== undefined) {
    if (!name) throw new Error("El nombre no puede estar vacío.");
    if (name.length < 2)  throw new Error("El nombre debe tener al menos 2 caracteres.");
    if (name.length > 80) throw new Error("El nombre no puede superar los 80 caracteres.");

    if (await nameExists(name, id)) {
      throw new Error(`Ya existe otra categoría con el nombre "${name}".`);
    }
  }

  /* Solo actualizar los campos que llegan en el body */
  const patch: Record<string, unknown> = {};
  if (name        !== undefined) patch.name        = name;
  if (description !== undefined) patch.description = description || null;
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
    .update(categories)
    .set(patch)
    .where(eq(categories.id, id))
    .returning();

  return updated;
};

/* ── Alternar estado ACTIVE ↔ INACTIVE ── */
export const toggleCategoryStatus = async (id: number) => {
  const [existing] = await db.select().from(categories).where(eq(categories.id, id));
  if (!existing) throw new Error("Categoría no encontrada.");

  const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const [updated] = await db
    .update(categories)
    .set({ status: newStatus })
    .where(eq(categories.id, id))
    .returning();

  return updated;
};

/* ── Eliminar ── */
export const deleteCategory = async (id: number) => {
  const [existing] = await db.select().from(categories).where(eq(categories.id, id));
  if (!existing) throw new Error("Categoría no encontrada o ya fue eliminada.");

  await db.delete(categories).where(eq(categories.id, id));
  return existing;
};
