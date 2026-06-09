import type { FastifyRequest, FastifyReply } from "fastify";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  getStats: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { start, end } = request.query as { start?: string; end?: string };
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (start) startDate = new Date(start);
      if (end) endDate = new Date(end);

      const stats = await dashboardService.getStats(startDate, endDate);
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({
        message: "Error al obtener estadísticas del dashboard.",
        error: error.message
      });
    }
  }
};
