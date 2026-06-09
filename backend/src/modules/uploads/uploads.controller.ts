import type { FastifyReply, FastifyRequest } from "fastify";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { extname, join } from "path";
import { pipeline } from "stream/promises";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const UPLOADS_DIR = join(__dirname, "..", "..", "..", "uploads", "products");

/* Garantizar que el directorio exista al iniciar */
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const UploadsController = {
  async uploadProductImage(request: FastifyRequest, reply: FastifyReply) {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ message: "No se recibió ningún archivo." });
    }

    if (!ALLOWED_MIME.has(data.mimetype)) {
      return reply.status(400).send({
        message: "Formato no permitido. Solo se aceptan: JPG, PNG, WEBP, GIF.",
      });
    }

    const ext      = extname(data.filename).toLowerCase() || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(UPLOADS_DIR, filename);

    /* Leer los bytes y verificar tamaño */
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

    return reply.status(201).send({ url: `/uploads/products/${filename}` });
  }
};
