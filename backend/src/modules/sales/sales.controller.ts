import type { FastifyRequest, FastifyReply } from "fastify";
import { salesService } from "./sales.service";
import type { CreateSaleDTO, UpdateSaleDTO } from "./sales.types";
import { auditLogsService } from "../audit-logs/audit-logs.service";
import { sendMail } from "../mail/mail.service";
import { EmailTemplates } from "../mail/mail.templates";

export const salesController = {

  getAll: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await salesService.getAll();
      return reply.send(data);
    } catch (err: any) {
      return reply.status(500).send({ message: err.message || "Error al obtener ventas." });
    }
  },

  getStats: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await salesService.getStats();
      return reply.send(stats);
    } catch (err: any) {
      return reply.status(500).send({ message: err.message || "Error al obtener estadísticas." });
    }
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const data = await salesService.getById(Number(id));
      return reply.send(data);
    } catch (err: any) {
      return reply.status(404).send({ message: err.message || "Venta no encontrada." });
    }
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as CreateSaleDTO;
      const created = await salesService.create(body);

      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Ventas",
          action:   "CREAR",
          details:  { notes: `Venta ${created.saleNumber} creada para ${created.clientName}` },
        }).catch(console.error);
      }

      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al crear venta." });
    }
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateSaleDTO;
      const updated = await salesService.update(Number(id), body);

      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Ventas",
          action:   "EDITAR",
          details:  { notes: `Venta ${updated.saleNumber} actualizada` },
        }).catch(console.error);
      }

      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al actualizar venta." });
    }
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const deleted = await salesService.delete(Number(id));

      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Ventas",
          action:   "ELIMINAR",
          details:  { notes: `Venta ${deleted.saleNumber} eliminada` },
        }).catch(console.error);
      }

      return reply.send({ message: "Venta eliminada con éxito.", deleted });
    } catch (err: any) {
      return reply.status(400).send({ message: err.message || "Error al eliminar venta." });
    }
  },

  sendEmail: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const s = await salesService.getById(Number(id));
      if (!s.clientEmail?.trim()) {
        return reply.status(400).send({ message: "El cliente no tiene un correo electrónico registrado." });
      }
      
      const docName = s.billingType === "BOLETA" ? "Boleta de Venta" : s.billingType === "FACTURA" ? "Factura" : "Nota de Venta";
      const docCode = s.billingNumber || s.saleNumber;
      
      const html = EmailTemplates.getSaleTemplate(s);
      const mailResult = await sendMail(s.clientEmail.trim(), `${docName} ${docCode} - Industria Gráfica Damian`, html);
      
      const currentUser = request.currentUser;
      if (currentUser) {
        auditLogsService.createLog({
          userId:   currentUser.id,
          username: currentUser.username,
          module:   "Ventas",
          action:   "EDITAR",
          details:  { notes: `${docName} ${docCode} enviada por correo a ${s.clientEmail}${mailResult.previewUrl ? ` (Preview: ${mailResult.previewUrl})` : ''}` },
        }).catch(console.error);
      }

      return reply.send({ message: "Correo enviado con éxito.", ...mailResult });
    } catch (err: any) {
      return reply.status(500).send({ message: err.message || "Error al enviar el correo." });
    }
  },
};
