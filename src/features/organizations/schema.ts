import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export type OrganizationFormState = {
  message?: string;
  errors?: Partial<Record<"name", string[]>>;
  values?: { name?: string };
};

// "Mi Equipo Ñandú" → "mi-equipo-nandu". Solo [a-z0-9-], apto para URLs.
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes y diéresis
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
