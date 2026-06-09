import type { FastifyReply, FastifyRequest } from "fastify";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { extname, join } from "path";
import { pipeline } from "stream/promises";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import {
  getSettings,
  updateSettings,
  getBackupData,
  restoreBackupData,
  resetDatabase,
} from "./settings.service";
import { auditLogsService } from "../audit-logs/audit-logs.service";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SETTINGS_UPLOADS_DIR = join(__dirname, "..", "..", "..", "uploads", "settings");

if (!existsSync(SETTINGS_UPLOADS_DIR)) {
  mkdirSync(SETTINGS_UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const SettingsController = {
  async get(request: FastifyRequest, reply: FastifyReply) {
    const data = await getSettings();
    return reply.send(data);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ message: "Cuerpo de la petición inválido." });
    }

    const updated = await updateSettings(body);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Configuración",
        action: "EDITAR",
        details: { notes: "Actualización de parámetros generales de la empresa" }
      }).catch(err => request.log.error(err));
    }

    return reply.send(updated);
  },

  async uploadFile(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ message: "No se recibió ningún archivo." });
    }

    if (!ALLOWED_MIME.has(data.mimetype)) {
      return reply.status(400).send({
        message: "Formato no permitido. Solo se aceptan: JPG, PNG, WEBP, GIF.",
      });
    }

    const ext = extname(data.filename).toLowerCase() || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(SETTINGS_UPLOADS_DIR, filename);

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
      const total = chunks.reduce((acc, c) => acc + c.length, 0);
      if (total > MAX_SIZE_BYTES || (data.file as any).truncated || (data as any).truncated) {
        return reply.status(400).send({ message: "El archivo supera el límite de 2 MB." });
      }
    }

    if ((data.file as any).truncated || (data as any).truncated) {
      return reply.status(400).send({ message: "El archivo supera el límite de 2 MB." });
    }

    const buffer = Buffer.concat(chunks);
    await pipeline(
      (async function* () { yield buffer; })(),
      createWriteStream(filepath)
    );

    return reply.status(201).send({ url: `/uploads/settings/${filename}` });
  },

  async downloadBackup(request: FastifyRequest, reply: FastifyReply) {
    const backupData = await getBackupData();

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Configuración",
        action: "ELIMINAR", // Backup download logged as database export
        details: { notes: "Exportación de copia de seguridad de la base de datos" }
      }).catch(err => request.log.error(err));
    }

    reply.header("Content-Disposition", "attachment; filename=backup-damian-print.json");
    reply.type("application/json");
    return reply.send(backupData);
  },

  async restoreBackup(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    if (!body || !body.backup) {
      return reply.status(400).send({ message: "Copia de seguridad no proporcionada." });
    }

    await restoreBackupData(body.backup);

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Configuración",
        action: "CREAR",
        details: { notes: "Restauración completa de la base de datos" }
      }).catch(err => request.log.error(err));
    }

    return reply.send({ success: true, message: "Base de datos restaurada correctamente." });
  },

  async reset(request: FastifyRequest, reply: FastifyReply) {
    await resetDatabase();

    const currentUser = request.currentUser;
    if (currentUser) {
      auditLogsService.createLog({
        userId: currentUser.id,
        username: currentUser.username,
        module: "Configuración",
        action: "ELIMINAR",
        details: { notes: "Reseteo completo de datos operativos" }
      }).catch(err => request.log.error(err));
    }

    return reply.send({ success: true, message: "Datos operativos eliminados correctamente." });
  }
};
