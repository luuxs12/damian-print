/* eslint-disable react-hooks/set-state-in-effect */
import "./roles-table.scss";
import { Pencil, Trash2, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/shared/components/ui/confirm-modal";
import { generatePageNumbers } from "@/shared/utils/pagination";
import type { Role } from "../../types/role.types";
import { rolesService } from "../../services/roles-service";
import { useAuthStore } from "@/modules/auth/store/auth-store";

const TOTAL_MODULES = 11;

interface Props {
  onEditRole: (role: Role) => void;
  onDeleteSuccess?: (msg: string) => void;
}

export const RolesTable = ({ onEditRole, onDeleteSuccess }: Props) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalType, setModalType] = useState<"edit" | "delete" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const session = useAuthStore((state) => state.session);

  const itemsPerPage = 5;

  const loadRoles = async () => {
    try {
      const response = await rolesService.getRoles();
      setRoles(response);
    } catch {
      toast.error("Error cargando perfiles");
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const value = search.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(value) ||
        (role.description && role.description.toLowerCase().includes(value))
    );
  }, [roles, search]);

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setModalType("delete");
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      await rolesService.deleteRole(selectedRole.id);
      setRoles((prev) => prev.filter((role) => role.id !== selectedRole.id));
      toast.success("Perfil eliminado correctamente");
      if (onDeleteSuccess) {
        onDeleteSuccess("¡Perfil eliminado con éxito!");
      }
      setSelectedRole(null);
      setModalType(null);
    } catch {
      toast.error("Error eliminando perfil");
    }
  };

  return (
    <div className="roles-table-card">
      <div className="roles-table-top">
        <div>
          <h2>Lista de perfiles</h2>
        </div>
        <input
          type="text"
          placeholder="Buscar perfil..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="roles-table-wrapper">
        <table className="roles-table">
          <thead>
            <tr>
              <th>Perfil</th>
              <th>Descripción</th>
              <th>Acceso a módulos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRoles.map((role) => {
              const count = role.permissions.length;
              const isFullAccess = count === TOTAL_MODULES;

              return (
                <tr key={role.id}>
                  <td>
                  <span className="role-badge">{role.name}</span>
                </td>
                  <td>
                    <span className="role-description">{role.description || "—"}</span>
                  </td>
                  <td>
                    <div className="permissions-summary">
                      {isFullAccess ? (
                        <div className="permissions-full">
                          <ShieldCheck size={14} />
                          <span>Acceso total</span>
                        </div>
                      ) : count === 0 ? (
                        <div className="permissions-none">
                          Sin acceso
                        </div>
                      ) : (
                        <div className="permissions-partial-badge">
                          <ShieldCheck size={14} />
                          <span>{count} módulos</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className={`edit-btn ${role.name.toLowerCase() === "administrador" ? "edit-btn--disabled" : ""}`} 
                        onClick={() => {
                          if (role.name.toLowerCase() === "administrador") {
                            setSelectedRole(role);
                            setModalType("edit");
                          } else {
                            onEditRole(role);
                          }
                        }}
                        title={role.name.toLowerCase() === "administrador" ? "No se puede editar el perfil de Administrador" : undefined}
                      >
                        <Pencil size={18} />
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteClick(role)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredRoles.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "40px", opacity: 0.7 }}>
                  No se encontraron perfiles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shared-pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          title="Anterior"
        >
          <ChevronLeft size={18} />
        </button>
        {generatePageNumbers(currentPage, totalPages).map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(Number(page))}
              className={currentPage === page ? "active" : ""}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          title="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {selectedRole && modalType === "delete" && (
        selectedRole.name.toLowerCase() === "administrador" ? (
          <ConfirmModal
            title="Acción no permitida"
            description="No puedes eliminar el perfil de Administrador. Este perfil es crítico para el correcto funcionamiento del sistema."
            confirmLabel="Entendido"
            onClose={() => { setSelectedRole(null); setModalType(null); }}
            onConfirm={() => { setSelectedRole(null); setModalType(null); }}
            icon="warning"
            showCancel={false}
          />
        ) : session?.user?.role?.toLowerCase() === selectedRole.name.toLowerCase() ? (
          <ConfirmModal
            title="Acción no permitida"
            description="No puedes eliminar el perfil que tienes asignado actualmente."
            confirmLabel="Entendido"
            onClose={() => { setSelectedRole(null); setModalType(null); }}
            onConfirm={() => { setSelectedRole(null); setModalType(null); }}
            icon="warning"
            showCancel={false}
          />
        ) : (
          <ConfirmModal
            title="¿Eliminar perfil?"
            description={`Esta acción eliminará el perfil "${selectedRole.name}" permanentemente.`}
            onClose={() => { setSelectedRole(null); setModalType(null); }}
            onConfirm={handleDelete}
          />
        )
      )}

      {selectedRole && modalType === "edit" && selectedRole.name.toLowerCase() === "administrador" && (
        <ConfirmModal
          title="Acción no permitida"
          description="No puedes editar ni modificar los permisos del perfil de Administrador por razones de seguridad."
          confirmLabel="Entendido"
          onClose={() => { setSelectedRole(null); setModalType(null); }}
          onConfirm={() => { setSelectedRole(null); setModalType(null); }}
          icon="warning"
          showCancel={false}
        />
      )}
    </div>
  );
};