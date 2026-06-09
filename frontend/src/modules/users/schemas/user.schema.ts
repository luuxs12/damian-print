import { z } from "zod";

export const userSchema =
  z.object({

    username:
      z
        .string()
        .min(
          3,
          "El nombre debe tener mínimo 3 caracteres"
        ),

    email:
      z
        .email(
          "Correo inválido"
        ),

    phone:
      z
        .string()
        .min(
          9,
          "Teléfono inválido"
        ),

    password:
      z
        .string()
        .min(
          6,
          "La contraseña debe tener mínimo 6 caracteres"
        ),

    role:
      z
        .string()
        .min(
          1,
          "Seleccione un rol"
        ),

    status:
      z.enum([
        "ACTIVE",
        "INACTIVE",
      ]),
  });

export type UserFormData =
  z.infer<
    typeof userSchema
  >;