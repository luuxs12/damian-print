/* ── DTOs con campos opcionales para actualizaciones parciales ── */

export interface CreateRoleDTO {
  name:         string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleDTO {
  name?:         string;
  description?:  string;
  permissions?:  string[];
}
