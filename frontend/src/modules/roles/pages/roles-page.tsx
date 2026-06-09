import "./roles-page.scss";
import { useState } from "react";
import { RoleHeader } from "../components/role-header";
import { RolesTable } from "../components/roles-table";
import { RoleForm } from "../components/role-form";
import type { Role } from "../types/role.types";

export const RolesPage = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setSelectedRole(undefined);
    setOpenForm(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setOpenForm(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="roles-page">
      <RoleHeader onCreateRole={handleCreate} />
      <RolesTable key={refreshKey} onEditRole={handleEdit} />

      {openForm && (
        <RoleForm
          mode={selectedRole ? "edit" : "create"}
          initialData={selectedRole}
          onClose={() => setOpenForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};