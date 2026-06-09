import {
  Navigate,
  createBrowserRouter,
} from "react-router-dom";

import { DashboardLayout } from "@/layouts/dashboard-layout/dashboard-layout";
import { AuthLayout }      from "@/layouts/auth-layout/auth-layout";

import { LoginPage }      from "@/modules/auth/pages/login-page";
import { ProtectedRoute } from "@/modules/auth/components/protected-route/protected-route";

import { WelcomePage }      from "@/modules/welcome/pages/welcome-page";
import { DashboardPage }    from "@/modules/dashboard/pages/dashboard-page";
import { UsersPage }        from "@/modules/users/pages/users-page";
import { RolesPage }        from "@/modules/roles/pages/roles-page";
import { ProductsPage }     from "@/modules/products/pages/products-page";
import { CategoriesPage }   from "@/modules/categories/pages/categories-page";
import { AuditLogsPage }    from "@/modules/audit-logs/pages/audit-logs-page";
import { ClientsPage }      from "@/modules/clients/pages/clients-page";
import { SuppliesPage }     from "@/modules/supplies/pages/supplies-page";
import { ProductionPage }   from "@/modules/production/pages/production-page";
import { SettingsPage }     from "@/modules/settings/pages/settings-page";
import { PresentationsPage } from "@/modules/presentations/pages/presentations-page";
import { QuotationsPage }   from "@/modules/quotations/pages/quotations-page";
import { SalesPage }        from "@/modules/sales/pages/sales-page";


export const appRouter = createBrowserRouter([

  /* ── Autenticación ── */
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
    ],
  },

  /* ── Dashboard protegido ── */
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [

      /* Pantalla de bienvenida — ruta raíz para TODOS los usuarios */
      { index: true, element: <WelcomePage /> },

      { path: "dashboard",     element: <DashboardPage /> },
      { path: "users",         element: <UsersPage />    },
      { path: "roles",         element: <RolesPage />    },
      { path: "products",      element: <ProductsPage /> },
      { path: "categories",    element: <CategoriesPage /> },
      { path: "audit-logs",    element: <AuditLogsPage /> },
      { path: "clients",       element: <ClientsPage />   },
      { path: "supplies",      element: <SuppliesPage />  },
      { path: "presentations", element: <PresentationsPage /> },
      { path: "production",    element: <ProductionPage /> },
      { path: "settings",      element: <SettingsPage />   },
      { path: "quotations",    element: <QuotationsPage /> },
      { path: "sales",         element: <SalesPage />      },

      /* Ruta fallback — redirige a bienvenida si no existe la ruta */
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);