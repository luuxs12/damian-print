/* ── DTOs de usuarios ── */

export interface CreateUserDTO {
  username: string;
  email:    string;
  phone?:   string;
  password: string;
  role:     string;
  status?:  "ACTIVE" | "INACTIVE";
}

export interface UpdateUserDTO {
  username?: string;
  email?:    string;
  phone?:    string;
  role?:     string;
  status?:   "ACTIVE" | "INACTIVE";
  password?: string;
}