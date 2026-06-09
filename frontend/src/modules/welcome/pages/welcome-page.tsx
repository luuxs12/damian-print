import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/auth-store";
import "./welcome-page.scss";

/* Íconos de módulos disponibles según rol */
const allModules = [
  { label: "Dashboard",      path: "/dashboard",     emoji: "📊" },
  { label: "Usuarios",       path: "/users",         emoji: "👥" },
  { label: "Perfiles",       path: "/roles",         emoji: "🛡️" },
  { label: "Categorías",     path: "/categories",    emoji: "🏷️" },
  { label: "Productos",      path: "/products",      emoji: "📦" },
  { label: "Clientes",       path: "/clients",       emoji: "👤" },
  { label: "Insumos",        path: "/supplies",      emoji: "🧪" },
  { label: "Cotizaciones",   path: "/quotations",    emoji: "📋", disabled: true },
  { label: "Ventas",         path: "/sales",         emoji: "🛒", disabled: true },
  { label: "Producción",     path: "/production",    emoji: "🏭", disabled: true },
  { label: "Configuración",  path: "/settings",      emoji: "⚙️", disabled: true },
];

export const WelcomePage = () => {
  const navigate   = useNavigate();
  const session    = useAuthStore((s) => s.session);
  const user       = session?.user;
  const role       = user?.role?.toLowerCase() || "";
  const isAdmin    = role === "administrador" || role === "admin";
  const permissions = user?.permissions || [];

  /* Filtrar módulos según permisos del usuario */
  const visibleModules = allModules.filter((m) =>
    isAdmin || permissions.includes(m.label)
  );

  /* Hora del día para personalizar el saludo */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" :
    hour < 18 ? "Buenas tardes" :
                "Buenas noches";

  return (
    <div className="welcome-page">

      {/* Fondo con gradiente dinámico */}
      <div className="welcome-page__bg" />

      {/* Contenido centrado */}
      <div className="welcome-page__content">

        <motion.div
          className="welcome-page__header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1,  y: 0  }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="welcome-page__avatar">
            {user?.username?.substring(0, 2).toUpperCase() ?? "DP"}
          </div>

          <h1 className="welcome-page__title">
            {greeting}, <span>{user?.username ?? "Usuario"}</span>
          </h1>

          <p className="welcome-page__subtitle">
            {user?.role ?? "Sistema"} · Selecciona un módulo para comenzar
          </p>
        </motion.div>

        {/* Grid de módulos */}
        <motion.div
          className="welcome-page__grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden:  {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {visibleModules.map((mod) => (
            <motion.button
              key={mod.path}
              className={`welcome-module-card${mod.disabled ? " welcome-module-card--disabled" : ""}`}
              onClick={() => {
                if (mod.disabled) {
                  toast.info(`El módulo de ${mod.label} estará disponible próximamente.`);
                } else {
                  navigate(mod.path);
                }
              }}
              variants={{
                hidden:  { opacity: 0, scale: 0.90 },
                visible: { opacity: 1, scale: 1.00 },
              }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              whileHover={mod.disabled ? {} : { scale: 1.04, transition: { duration: 0.12 } }}
              whileTap={mod.disabled ? {} : { scale: 0.96 }}
            >
              <span className="welcome-module-card__emoji">{mod.emoji}</span>
              <span className="welcome-module-card__label">
                {mod.label}
                {mod.disabled && <span className="welcome-soon-tag">Soon</span>}
              </span>
            </motion.button>
          ))}
        </motion.div>

      </div>
    </div>
  );
};
