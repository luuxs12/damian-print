import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  email: string;
  permissions?: string[];
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

interface AuthState {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
}

const STORAGE_KEY = "damian-print-session-v2";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

export const authStore = {
  saveSession: (session: AuthSession) => {
    useAuthStore.getState().setSession(session);
    localStorage.setItem("auth_token", session.token);
  },

  getSession: () => {
    return useAuthStore.getState().session;
  },

  clearSession: () => {
    useAuthStore.getState().setSession(null);
    localStorage.removeItem("auth_token");
  },

  isAuthenticated: () => {
    return !!useAuthStore.getState().session;
  },

  getPermissions: () => {
    const session = useAuthStore.getState().session;
    return session?.user?.permissions || [];
  },

  hasPermission: (permission: string) => {
    const permissions = authStore.getPermissions();
    return permissions.includes(permission);
  },
};