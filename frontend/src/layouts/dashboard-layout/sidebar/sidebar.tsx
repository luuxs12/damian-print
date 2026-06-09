import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Package,
  Tags,
  UserRound,
  FileText,
  ShoppingCart,
  Factory,
  Settings,
  Menu,
  ClipboardList,
  Layers,
  Boxes,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { toast } from "sonner";

import { useAuthStore } from "@/modules/auth/store/auth-store";

import defaultLogo from "@/assets/images/branding/tulogoaqui.png";

import { settingsService } from "@/modules/settings/services/settings-service";

import "./sidebar.scss";

const menuItems = [
  { label: "Dashboard",      icon: LayoutDashboard, path: "/dashboard" },
  { label: "Cotizaciones",   icon: FileText,        path: "/quotations" },
  { label: "Ventas",         icon: ShoppingCart,    path: "/sales",         disabled: true },
  { label: "Producción",     icon: Factory,         path: "/production" },
  { label: "Clientes",       icon: UserRound,       path: "/clients" },
  { label: "Productos",      icon: Package,         path: "/products" },
  { label: "Categorías",     icon: Tags,            path: "/categories" },
  { label: "Presentaciones", icon: Layers,          path: "/presentations" },
  { label: "Usuarios",       icon: Users,           path: "/users" },
  { label: "Perfiles",       icon: Shield,          path: "/roles" },
  { label: "Auditoría",      icon: ClipboardList,   path: "/audit-logs" },
  { label: "Insumos",        icon: Boxes,           path: "/supplies" },
  { label: "Configuración",  icon: Settings,        path: "/settings" },
];

interface SidebarProps {
  onClose?:           () => void;
  collapsed?:         boolean;
  onToggleCollapse?:  () => void;
}

export const Sidebar = ({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) => {
  const session    = useAuthStore((state) => state.session);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const data = await settingsService.getSettings();
        if (data.systemLogo) {
          const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
          setLogoUrl(`${API_URL}${data.systemLogo}`);
        }
      } catch (err) {
        console.error("Error fetching logo for sidebar:", err);
      }
    };
    fetchLogo();
  }, []);

  return (
    <div className={`sidebar-container${collapsed ? " sidebar-container--collapsed" : ""}`}>

      {/* Logo / Hamburger */}
      <div className="sidebar-logo">
        <img
          src={logoUrl || defaultLogo}
          alt="Damian Print"
          className="sidebar-logo-image"
        />


        <button
          className={`sidebar-menu-btn ${collapsed ? "collapsed" : ""}`}
          onClick={onToggleCollapse}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {menuItems.filter(item => {
          const permissions = session?.user?.permissions || [];
          const role = session?.user?.role?.toLowerCase() || "";
          if (role === "administrador" || role === "admin") return true;
          return permissions.includes(item.label);
        }).map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <button
                key={item.label}
                onClick={() => toast.info(`El módulo de ${item.label} estará disponible próximamente.`)}
                title={collapsed ? `${item.label} (Próximamente)` : undefined}
                className="sidebar-link sidebar-link--disabled"
              >
                <Icon size={20} />
                <span className="sidebar-link-text-wrapper">
                  <span className="sidebar-text-label">{item.label}</span>
                  <span className="coming-soon-badge">Soon</span>
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <Icon size={20} />
              <span className="sidebar-text-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
};