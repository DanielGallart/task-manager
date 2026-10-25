import { z } from "zod";

// Límites alineados con los de Better Auth (min 8 / max 128 por defecto),
// para que el error lo dé Zod con un mensaje claro y no la API.
const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña no puede superar los 128 caracteres");

const email = z.email("Introduce un email válido").max(255);

export const loginSchema = z.object({
  email,
  // En login no validamos la longitud: solo que no esté vacía. Si no,
  // estaríamos dando pistas sobre las reglas de contraseñas existentes.
  password: z.string().min(1, "Introduce tu contraseña"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Introduce tu nombre")
    .max(255, "El nombre es demasiado largo"),
  email,
  password,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Estado que devuelven las Server Actions a los formularios (useActionState).
// `values` permite repoblar los campos tras un error (React resetea el form al enviar);
// nunca incluye la contraseña.
export type AuthFormState = {
  message?: string;
  errors?: Partial<Record<"name" | "email" | "password", string[]>>;
  values?: { name?: string; email?: string };
};
