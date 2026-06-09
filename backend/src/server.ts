import Fastify       from "fastify";
import cors          from "@fastify/cors";
import jwt           from "@fastify/jwt";
import multipart     from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import helmet        from "@fastify/helmet";
import rateLimit     from "@fastify/rate-limit";
import { join }      from "path";
import { fileURLToPath } from "url";

import { authenticate }     from "./middlewares/authenticate";
import { authRoutes }       from "./modules/auth/auth.routes";
import { usersRoutes }      from "./modules/users/users.routes";
import { rolesRoutes }      from "./modules/roles/roles.routes";
import { categoriesRoutes } from "./modules/categories/categories.routes";
import { productsRoutes }   from "./modules/products/products.routes";
import { presentationsRoutes } from "./modules/presentations/presentations.routes";
import { uploadsRoutes }    from "./modules/uploads/uploads.routes";
import { auditLogsRoutes }  from "./modules/audit-logs/audit-logs.routes";
import { clientsRoutes }    from "./modules/clients/clients.routes";
import { suppliesRoutes }   from "./modules/supplies/supplies.routes";
import { productionRoutes } from "./modules/production/production.routes";
import { settingsRoutes }   from "./modules/settings/settings.routes";
import { quotationsRoutes } from "./modules/quotations/quotations.routes";
import { salesRoutes }      from "./modules/sales/sales.routes";
import { dashboardRoutes }  from "./modules/dashboard/dashboard.routes";


const __dirname = fileURLToPath(new URL(".", import.meta.url));
const UPLOADS_DIR = join(__dirname, "..", "uploads");

const app = Fastify({ logger: true });

/* ── Plugins de Seguridad ── */

// 1. Cabeceras de seguridad HTTP
await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// 2. Control de acceso de orígenes (CORS)
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
await app.register(cors, {
  origin:         allowedOrigin === "*" ? true : allowedOrigin,
  methods:        ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials:    true,
});

// 3. Limitador de peticiones (Rate Limit) para mitigar ataques DDoS y fuerza bruta
await app.register(rateLimit, {
  max: 200,
  timeWindow: "1 minute",
  keyGenerator: (request: any) => {
    return (request.headers["x-real-ip"] as string) || 
           (request.headers["x-forwarded-for"] as string) || 
           request.ip;
  },
  allowList: (request: any) => {
    return request.url.startsWith("/uploads/") || request.method === "OPTIONS";
  },
  errorResponseBuilder: (request: any, context: any) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Demasiadas peticiones. Por favor, reduce el ritmo de consultas. Intenta en ${context.after}.`
    };
  }
});

await app.register(jwt, { secret: process.env.JWT_SECRET ?? "damianprintsecret" });

/* Multipart: limitar a 2 MB */
await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });

/* Archivos estáticos con cache de 1 año */
await app.register(fastifyStatic, {
  root:       UPLOADS_DIR,
  prefix:     "/uploads/",
  decorateReply: false,
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
});

/* ── Protección global: todas las rutas salvo /auth, /uploads y OPTIONS ── */
app.addHook("onRequest", async (request, reply) => {
  if (request.url.startsWith("/auth"))    return;
  if (request.url.startsWith("/uploads")) return; // imágenes públicas
  if (request.method === "OPTIONS")       return;
  await authenticate(request, reply);
});

/* ── Rutas ── */
await app.register(authRoutes,       { prefix: "/auth"       });
await app.register(usersRoutes,      { prefix: "/users"      });
await app.register(rolesRoutes,      { prefix: "/roles"      });
await app.register(categoriesRoutes, { prefix: "/categories" });
await app.register(productsRoutes,   { prefix: "/products"   });
await app.register(presentationsRoutes, { prefix: "/presentations" });
await app.register(uploadsRoutes,    { prefix: "/uploads"    });
await app.register(auditLogsRoutes,  { prefix: "/audit-logs" });
await app.register(clientsRoutes,    { prefix: "/clients"    });
await app.register(suppliesRoutes,   { prefix: "/supplies"   });
await app.register(productionRoutes, { prefix: "/production" });
await app.register(settingsRoutes,    { prefix: "/settings"    });
await app.register(quotationsRoutes,  { prefix: "/quotations"  });
await app.register(salesRoutes,       { prefix: "/sales"       });
await app.register(dashboardRoutes,   { prefix: "/dashboard"   });


/* ── Arrancar ── */
try {
  await app.listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
  console.log(`🚀 Backend corriendo en http://localhost:${process.env.PORT ?? 4000}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}