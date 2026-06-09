import "./user-form.scss";
import { X, UserPlus, Eye, EyeOff, Shield, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "../../types/user.types";
import { useEffect, useState } from "react";
import { rolesService } from "@/modules/roles/services/roles-service";
import type { Role } from "@/modules/roles/types/role.types";
import { usersService } from "@/modules/users/services/users-service";
import { authStore } from "@/modules/auth/store/auth-store";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";

const schema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  email:    z.email("Correo inválido"),
  phone:    z.string().optional().refine((val) => !val || val.length >= 9, "Teléfono inválido"),
  role:     z.string(),
  status:   z.enum(["ACTIVE", "INACTIVE"]),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value === "" || value.length >= 6, { message: "Mínimo 6 caracteres" }),
});

type FormData = z.infer<typeof schema>;

interface Props {
  mode:         "create" | "edit";
  initialData?: User;
  onClose:      () => void;
  onSuccess:    () => void;
}

export const UserForm = ({ mode, initialData, onClose, onSuccess }: Props) => {
  const currentSession = authStore.getSession();
  const isSelf = currentSession?.user?.id === initialData?.id;

  const [roles, setRoles]           = useState<Role[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    rolesService.getRoles().then(setRoles).catch(() => toast.error("Error cargando roles"));
  }, []);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: initialData?.username || "",
      email:    initialData?.email    || "",
      phone:    initialData?.phone    || "",
      role:     initialData?.role     || "",
      status:   initialData?.status   || "ACTIVE",
      password: "",
    },
  });

  const statusValue = watch("status");

  const handlePreSubmit = (data: FormData) => {
    if (mode === "create" && !data.password) {
      toast.error("La contraseña es obligatoria");
      return;
    }
    setPendingData(data);
    setShowConfirm(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "create") {
        await usersService.createUser({
          username: data.username,
          email:    data.email,
          phone:    data.phone,
          password: data.password!,
          role:     data.role,
          status:   data.status,
        });
      } else if (mode === "edit" && initialData) {
        const updatedUser = await usersService.updateUser(initialData.id, {
          username: data.username,
          email:    data.email,
          phone:    data.phone,
          role:     data.role,
          status:   data.status,
          password: data.password && data.password.trim() !== "" ? data.password : undefined,
        });
        const session = authStore.getSession();
        if (session && session.user.id === initialData.id) {
          authStore.saveSession({
            ...session,
            user: { ...session.user, username: updatedUser.username, role: updatedUser.role, email: updatedUser.email },
          });
        }
      }
      toast.success(mode === "create" ? "Usuario creado correctamente" : "Usuario actualizado correctamente");
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
      <div className="user-form-overlay">
        <div className="user-form-modal">
          {/* Cabecera */}
          <div className="user-form-header">
            <div className="user-form-header__icon">
              <UserPlus size={20} />
            </div>
            <div>
              <h2>{mode === "create" ? "Nuevo usuario" : "Editar usuario"}</h2>
              <p>{mode === "create" ? "Completa la información del nuevo usuario." : "Actualiza la información del usuario."}</p>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form className="user-form" onSubmit={handleSubmit(handlePreSubmit)}>
            <div className="user-form-scroll-area">

              {/* ── Sección 1: Datos del Usuario ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num"><Shield size={13} /></span>
                  <h3>Datos del Usuario</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Usuario <span className="form-required">*</span></label>
                    <input type="text" placeholder="Ingrese nombre de usuario" {...register("username")} />
                  </div>

                  <div className="form-group">
                    <label>Correo electrónico <span className="form-required">*</span></label>
                    <input type="email" placeholder="correo@empresa.com" {...register("email")} />
                  </div>

                  <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" placeholder="987654321" {...register("phone")} />
                  </div>

                  <div className="form-group">
                    <label>Perfil <span className="form-required">*</span></label>
                    <select {...register("role")}>
                      <option value="">-- Seleccionar perfil --</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  {mode === "edit" && (
                    <div className="form-group form-group--full">
                      <label>Estado</label>
                      <div className="status-toggle-wrapper" style={{ marginTop: "6px" }}>
                        <label className={`toggle-switch ${isSelf ? "toggle-switch--disabled" : ""}`} title={isSelf ? "No puedes desactivar tu propia cuenta" : undefined}>
                          <input
                            type="checkbox"
                            checked={statusValue === "ACTIVE"}
                            disabled={isSelf}
                            onChange={(e) => setValue("status", e.target.checked ? "ACTIVE" : "INACTIVE")}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span className={`status-label ${statusValue === "ACTIVE" ? "status-label--active" : "status-label--inactive"}`}>
                          {statusValue === "ACTIVE" ? "Activo" : "Inactivo"}
                        </span>
                        {isSelf && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
                            (Tu cuenta)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Sección 2: Seguridad ── */}
              <div className="form-section-card">
                <div className="section-title-row">
                  <span className="section-num"><Lock size={13} /></span>
                  <h3>Seguridad</h3>
                </div>
                {mode === "edit" && (
                  <p className="section-subtitle">Deja en blanco si no deseas cambiar la contraseña.</p>
                )}

                <div className="form-group">
                  <label>
                    Contraseña {mode === "create" && <span className="form-required">*</span>}
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Nueva contraseña (opcional)"}
                      {...register("password")}
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Acciones */}
            <div className="user-form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-save">
                <UserPlus size={16} />
                {mode === "create" ? "Guardar usuario" : "Actualizar usuario"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title={mode === "create" ? "¿Crear usuario?" : "¿Guardar cambios?"}
          description={
            mode === "create"
              ? "¿Estás seguro de que deseas registrar este nuevo usuario?"
              : "¿Estás seguro de que deseas guardar los cambios realizados en este usuario?"
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