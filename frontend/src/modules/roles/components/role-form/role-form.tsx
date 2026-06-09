import "./role-form.scss";
import {
  X, ShieldPlus, LayoutDashboard, Users, Shield, Tags, Package,
  UserRound, FileText, ShoppingCart, Factory, Settings, Layers, ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Role } from "../../types/role.types";
import { rolesService } from "../../services/roles-service";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";

const permissionsList = [
  "Dashboard", "Usuarios", "Perfiles", "Categorías", "Productos",
  "Insumos", "Auditoría", "Clientes", "Cotizaciones", "Ventas",
  "Producción", "Configuración",
];

const permissionIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  "Dashboard":     LayoutDashboard,
  "Usuarios":      Users,
  "Perfiles":      Shield,
  "Categorías":    Tags,
  "Productos":     Package,
  "Insumos":       Layers,
  "Auditoría":     ClipboardList,
  "Clientes":      UserRound,
  "Cotizaciones":  FileText,
  "Ventas":        ShoppingCart,
  "Producción":    Factory,
  "Configuración": Settings,
};

const schema = z.object({
  name:        z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().min(5, "Mínimo 5 caracteres"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode:         "create" | "edit";
  initialData?: Role;
  onClose:      () => void;
  onSuccess:    () => void;
}

export const RoleForm = ({ mode, initialData, onClose, onSuccess }: Props) => {
  const isAdminRole = initialData?.name?.toLowerCase() === "administrador";

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    initialData?.permissions || []
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        initialData?.name        || "",
      description: initialData?.description || "",
    },
  });

  const togglePermission = (permission: string) => {
    if (isAdminRole) return;
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  const handlePreSubmit = (data: FormData) => {
    if (isAdminRole) return;
    setPendingData(data);
    setShowConfirm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "create") {
        await rolesService.createRole({ name: data.name, description: data.description, permissions: selectedPermissions });
        toast.success("Perfil creado correctamente");
      } else if (mode === "edit" && initialData) {
        await rolesService.updateRole(initialData.id, { name: data.name, description: data.description, permissions: selectedPermissions });
        toast.success("Perfil actualizado correctamente");
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || (error instanceof Error ? error.message : "Ocurrió un error"));
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pendingData) return;
    setShowConfirm(false);
    await onSubmit(pendingData);
  };

  return (
    <>
      <div className="role-form-overlay">
        <div className="role-form-modal">
          {/* Cabecera */}
          <div className="role-form-header">
            <div className="role-form-header__icon">
              <ShieldPlus size={20} />
            </div>
            <div>
              <h2>{mode === "create" ? "Nuevo perfil" : "Editar perfil"}</h2>
              <p>Configura permisos y accesos del sistema.</p>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form className="role-form" onSubmit={handleSubmit(handlePreSubmit)}>
            <div className="role-form-scroll-area">

              {/* Aviso Administrador */}
              {isAdminRole && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}>
                  Este es el perfil de Administrador del sistema. Por motivos de seguridad, no se permiten modificar sus permisos ni su información básica.
                </div>
              )}

              {/* ── Sección 1: Datos del Perfil ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num"><Shield size={13} /></span>
                  <h3>Datos del Perfil</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre del perfil <span className="form-required">*</span></label>
                    <input type="text" placeholder="Ej: Vendedor" {...register("name")} disabled={isAdminRole} />
                    {errors.name && <span className="form-error">{errors.name.message}</span>}
                  </div>

                  <div className="form-group">
                    <label>Descripción <span className="form-required">*</span></label>
                    <input type="text" placeholder="Descripción del perfil" {...register("description")} disabled={isAdminRole} />
                    {errors.description && <span className="form-error">{errors.description.message}</span>}
                  </div>
                </div>
              </div>

              {/* ── Sección 2: Permisos del sistema ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num"><Settings size={13} /></span>
                  <h3>Permisos del sistema</h3>
                </div>

                <div className="permissions-grid">
                  {permissionsList.map((permission) => {
                    const IconComponent = permissionIcons[permission];
                    const isActive = selectedPermissions.includes(permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        disabled={isAdminRole}
                        className={`permission-card ${isActive ? "active" : ""} ${isAdminRole ? "permission-card--disabled" : ""}`}
                        onClick={() => togglePermission(permission)}
                      >
                        <div className="checkbox-indicator" />
                        {IconComponent && <IconComponent size={16} />}
                        <span className="permission-name">{permission}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Acciones */}
            <div className="role-form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                {isAdminRole ? "Cerrar" : "Cancelar"}
              </button>
              {!isAdminRole && (
                <button type="submit" className="btn-save">
                  <ShieldPlus size={16} />
                  {mode === "create" ? "Guardar perfil" : "Actualizar perfil"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title={mode === "create" ? "¿Crear perfil?" : "¿Guardar cambios?"}
          description={
            mode === "create"
              ? "¿Estás seguro de que deseas registrar este nuevo perfil?"
              : "¿Estás seguro de que deseas guardar los cambios realizados en este perfil?"
          }
          onConfirm={handleConfirmSubmit}
          onClose={() => setShowConfirm(false)}
          confirmLabel={mode === "create" ? "Crear" : "Guardar"}
          icon={mode === "create" ? "create" : "update"}
        />
      )}
    </>
  );
};