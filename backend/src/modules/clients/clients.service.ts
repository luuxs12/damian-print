import { eq, sql, ilike, or } from "drizzle-orm";
import { db }      from "../../db";
import { clients } from "../../db/schema/clients";
import { sanitize } from "../../utils/string";
import type { CreateClientDTO, UpdateClientDTO } from "./clients.types";

const VALID_DOCUMENT_TYPES: readonly string[] = ["DNI", "RUC", "CE", "PASAPORTE"] as const;
const VALID_TYPES: readonly string[]           = ["EMPRESA", "PARTICULAR"] as const;
const VALID_STATUSES: readonly string[]        = ["ACTIVE", "INACTIVE"] as const;

/* Valida la longitud del documento según el tipo */
const validateDocument = (documentType: string, document: string): void => {
  const clean = document.replace(/\s/g, "");
  if (documentType === "DNI"  && clean.length !== 8)  throw new Error("El DNI debe tener exactamente 8 dígitos.");
  if (documentType === "RUC"  && clean.length !== 11) throw new Error("El RUC debe tener exactamente 11 dígitos.");
  if (documentType === "CE"   && (clean.length < 9 || clean.length > 12)) {
    throw new Error("El Carné de Extranjería debe tener entre 9 y 12 caracteres.");
  }
};

/* Listar todos los clientes con estadísticas de pedidos (preparado para futura integración) */
export const getClients = async () => {
  return db
    .select({
      id:           clients.id,
      type:         clients.type,
      name:         clients.name,
      documentType: clients.documentType,
      document:     clients.document,
      phone:        clients.phone,
      email:        clients.email,
      address:      clients.address,
      city:         clients.city,
      contactName:  clients.contactName,
      notes:        clients.notes,
      status:       clients.status,
      createdAt:    clients.createdAt,
      updatedAt:    clients.updatedAt,
    })
    .from(clients)
    .orderBy(clients.createdAt);
};

/* Obtener un cliente por ID */
export const getClientById = async (id: number) => {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id));

  if (!client) throw new Error("Cliente no encontrado.");
  return client;
};

/* Buscar clientes por nombre o documento */
export const searchClients = async (query: string) => {
  const q = `%${query.toLowerCase()}%`;
  return db
    .select()
    .from(clients)
    .where(
      or(
        ilike(clients.name, q),
        ilike(clients.document, q),
        ilike(clients.email, q)
      )
    )
    .orderBy(clients.name);
};

/* Crear cliente */
export const createClient = async (data: CreateClientDTO) => {
  const name = sanitize(data.name);
  if (!name || name.length < 2) throw new Error("El nombre del cliente debe tener al menos 2 caracteres.");

  const document = sanitize(data.document);
  if (!document)  throw new Error("El número de documento es obligatorio.");

  if (!VALID_TYPES.includes(data.type))
    throw new Error("Tipo de cliente inválido. Usa EMPRESA o PARTICULAR.");

  if (!VALID_DOCUMENT_TYPES.includes(data.documentType))
    throw new Error("Tipo de documento inválido.");

  validateDocument(data.documentType, document);

  // Verificar unicidad del documento
  const [existing] = await db.select({ id: clients.id }).from(clients).where(eq(clients.document, document));
  if (existing) throw new Error(`Ya existe un cliente registrado con el documento ${document}.`);

  const [client] = await db
    .insert(clients)
    .values({
      type:         data.type,
      name,
      documentType: data.documentType,
      document,
      phone:        sanitize(data.phone) || null,
      email:        sanitize(data.email)?.toLowerCase() || null,
      address:      sanitize(data.address) || null,
      city:         sanitize(data.city) || null,
      contactName:  sanitize(data.contactName) || null,
      notes:        sanitize(data.notes) || null,
      status:       data.status || "ACTIVE",
    })
    .returning();

  return client;
};

/* Actualizar cliente */
export const updateClient = async (id: number, data: UpdateClientDTO) => {
  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) throw new Error("Cliente no encontrado.");

  const patch: Record<string, unknown> = {};

  if (data.type !== undefined) {
    if (!VALID_TYPES.includes(data.type))
      throw new Error("Tipo de cliente inválido.");
    patch.type = data.type;
  }

  if (data.name !== undefined) {
    const name = sanitize(data.name);
    if (!name || name.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");
    patch.name = name;
  }

  if (data.documentType !== undefined || data.document !== undefined) {
    const docType = data.documentType ?? existing.documentType;
    const docNum  = sanitize(data.document ?? existing.document);

    if (!VALID_DOCUMENT_TYPES.includes(docType))
      throw new Error("Tipo de documento inválido.");

    validateDocument(docType, docNum);

    // Si cambió el documento, verificar unicidad
    if (data.document && data.document !== existing.document) {
      const [dup] = await db.select({ id: clients.id }).from(clients).where(eq(clients.document, docNum));
      if (dup) throw new Error(`Ya existe un cliente con el documento ${docNum}.`);
    }

    patch.documentType = docType;
    patch.document     = docNum;
  }

  if (data.status !== undefined) {
    if (!VALID_STATUSES.includes(data.status))
      throw new Error("Estado inválido. Usa ACTIVE o INACTIVE.");
    patch.status = data.status;
  }

  if (data.phone       !== undefined) patch.phone       = sanitize(data.phone) || null;
  if (data.email       !== undefined) patch.email       = sanitize(data.email)?.toLowerCase() || null;
  if (data.address     !== undefined) patch.address     = sanitize(data.address) || null;
  if (data.city        !== undefined) patch.city        = sanitize(data.city) || null;
  if (data.contactName !== undefined) patch.contactName = sanitize(data.contactName) || null;
  if (data.notes       !== undefined) patch.notes       = sanitize(data.notes) || null;

  if (Object.keys(patch).length === 0) return existing;

  patch.updatedAt = new Date();

  const [updated] = await db
    .update(clients)
    .set(patch)
    .where(eq(clients.id, id))
    .returning();

  return updated;
};

/* Activar / Desactivar cliente */
export const toggleClientStatus = async (id: number) => {
  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) throw new Error("Cliente no encontrado.");

  const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const [updated] = await db
    .update(clients)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();

  return updated;
};

/* Eliminar cliente */
export const deleteClient = async (id: number) => {
  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) throw new Error("Cliente no encontrado.");
  await db.delete(clients).where(eq(clients.id, id));
  return existing;
};

/* Estadísticas resumen del módulo */
export const getClientsStats = async () => {
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(clients);
  const [active] = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.status, "ACTIVE"));
  const [empresa] = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.type, "EMPRESA"));
  const [particular] = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.type, "PARTICULAR"));

  return {
    total:      Number(total.count),
    active:     Number(active.count),
    empresa:    Number(empresa.count),
    particular: Number(particular.count),
  };
};

/* Consulta externa DNI / RUC (RENIEC / SUNAT) */
export const lookupDocument = async (documentType: string, document: string) => {
  const cleanDoc = document.trim();
  
  if (documentType === "DNI" && cleanDoc.length !== 8) {
    throw new Error("El DNI debe tener exactamente 8 dígitos.");
  }
  if (documentType === "RUC" && cleanDoc.length !== 11) {
    throw new Error("El RUC debe tener exactamente 11 dígitos.");
  }

  // 1. Intentar primero con graphperu (gratuito, rápido y sin token)
  try {
    console.log(`[RENIEC/SUNAT Lookup] Consultando en graphperu para ${documentType}: ${cleanDoc}`);
    const res = await fetch(`https://graphperu.daustinn.com/api/query/${cleanDoc}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      }
    });

    if (res.ok) {
      const data = await res.json() as any;
      if (data && (data.fullName || data.name)) {
        const isRuc = documentType === "RUC";
        if (isRuc) {
          const cityParts = [data.district, data.province, data.region].filter(Boolean);
          return {
            success: true,
            name: data.name,
            address: data.address || "",
            city: cityParts.join(" - ") || "",
            documentType: "RUC",
            document: cleanDoc,
          };
        } else {
          return {
            success: true,
            name: data.fullName,
            documentType: "DNI",
            document: cleanDoc,
          };
        }
      }
    }
  } catch (err) {
    console.error("Error al consultar graphperu, intentando con APIsPERU...", err);
  }

  // 2. Fallback a APIsPERU si graphperu falla o no tiene resultados
  const apiToken = process.env.RENIEC_SUNAT_API_TOKEN;
  const apiBaseUrl = process.env.RENIEC_SUNAT_API_URL || "https://dniruc.apisperu.com";
  
  if (!apiToken) {
    // Si no hay token de APIsPERU tampoco, lanzamos error
    throw new Error("No se encontraron resultados para el documento ingresado.");
  }

  try {
    const isRuc = documentType === "RUC";
    const endpoint = isRuc 
      ? `${apiBaseUrl}/api/v1/ruc/${cleanDoc}?token=${apiToken}`
      : `${apiBaseUrl}/api/v1/dni/${cleanDoc}?token=${apiToken}`;
      
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }
    });

    if (!res.ok) {
      throw new Error(`Error en la consulta externa de APIsPERU (código: ${res.status})`);
    }

    const data = await res.json() as any;
    console.log("[APIsPERU Response] data:", data);
    
    if (!data) {
      throw new Error("No se recibió respuesta del servidor de consulta.");
    }
    
    if (data.message) {
      throw new Error(data.message);
    }
    
    if (isRuc) {
      if (!data.razonSocial) {
        throw new Error("No se encontraron datos para el RUC ingresado.");
      }
      
      const cityParts = [data.distrito, data.provincia, data.departamento].filter(Boolean);
      return {
        success: true,
        name: data.razonSocial,
        address: data.direccion || "",
        city: cityParts.join(" - ") || "",
        documentType: "RUC",
        document: cleanDoc,
      };
    } else {
      if (!data.nombres) {
        throw new Error("No se encontraron datos para el DNI ingresado.");
      }
      
      const fullName = [data.nombres, data.apellidoPaterno, data.apellidoMaterno]
        .filter(Boolean)
        .join(" ");
        
      return {
        success: true,
        name: fullName,
        documentType: "DNI",
        document: cleanDoc,
      };
    }
  } catch (error: any) {
    console.error("Error al consultar API externa APIsPERU:", error);
    throw new Error(`La consulta de DNI/RUC falló: ${error.message || "Servicio no disponible"}`);
  }
};
