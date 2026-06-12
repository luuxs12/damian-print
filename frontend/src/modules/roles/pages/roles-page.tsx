import "./roles-page.scss";
import { useState } from "react";
import { RoleHeader } from "../components/role-header";
import { RolesTable } from "../components/roles-table";
import { RoleForm } from "../components/role-form";
import type { Role } from "../types/role.types";
import { SuccessAnimation } from "@/shared/components/ui/success-animation";

export const RolesPage = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedRole(undefined);
    setOpenForm(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setOpenForm(true);
  };

  const handleSuccess = () => {
    setSuccessMsg(selectedRole ? "¡Perfil actualizado con éxito!" : "¡Perfil registrado con éxito!");
    setRefreshKey((prev) => prev + 1);
    setOpenForm(false);
  };

  return (
    <div className="roles-page">
      <RoleHeader onCreateRole={handleCreate} />
      <RolesTable 
        key={refreshKey} 
        onEditRole={handleEdit} 
        onDeleteSuccess={(msg) => setSuccessMsg(msg)}
      />

      {openForm && (
        <RoleForm
          mode={selectedRole ? "edit" : "create"}
          initialData={selectedRole}
          onClose={() => setOpenForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      {successMsg && (
        <SuccessAnimation
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}
    </div>
  );
};