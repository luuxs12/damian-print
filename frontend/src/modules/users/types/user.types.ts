export type UserStatus =
  | "ACTIVE"
  | "INACTIVE";

export interface User {

  id: number;

  username: string;

  email: string;

  phone: string;

  role: string;

  status: UserStatus;

  createdAt: string;

  password?: string;
}