import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: {
      id: number;
      username: string;
      email: string | null;
      role: string;
    };
  }
}
