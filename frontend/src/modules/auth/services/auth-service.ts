import { api } from "../../../core/api";

interface LoginPayload {
  email: string;
  password: string;
}

export const loginRequest = async (data: LoginPayload) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const forgotPasswordRequest = async (email: string): Promise<{ message: string }> => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const verifyResetCodeRequest = async (email: string, code: string): Promise<{ resetToken: string }> => {
  const response = await api.post("/auth/verify-reset-code", { email, code });
  return response.data;
};

export const resetPasswordRequest = async (resetToken: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post("/auth/reset-password", { resetToken, newPassword });
  return response.data;
};