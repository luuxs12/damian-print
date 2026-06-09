import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ShoppingCart,
  Factory,
  Wallet,
  FileBarChart2,
} from "lucide-react";

export const SYSTEM_MODULES = [

  {
    key: "dashboard",

    label: "Dashboard",

    path: "/dashboard",

    icon:
      LayoutDashboard,
  },

  {
    key: "users",

    label: "Usuarios",

    path: "/users",

    icon:
      Users,
  },

  {
    key: "roles",

    label: "Perfiles",

    path: "/roles",

    icon:
      ShieldCheck,
  },

  {
    key: "sales",

    label: "Ventas",

    path: "/sales",

    icon:
      ShoppingCart,
  },

  {
    key: "production",

    label: "Producción",

    path: "/production",

    icon:
      Factory,
  },

  {
    key: "cashier",

    label: "Caja",

    path: "/cashier",

    icon:
      Wallet,
  },

  {
    key: "reports",

    label: "Reportes",

    path: "/reports",

    icon:
      FileBarChart2,
  },
] as const;