"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";
import { requireSession } from "@/features/auth/session";
import {
  createOrganizationSchema,
  slugify,
  type OrganizationFormState,
} from "./schema";

export async function createOrganizationAction(
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const { user } = await requireSession();

  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
  });
  const values = { name: String(formData.get("name") ?? "") };

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { name } = parsed.data;
  const baseSlug = slugify(name) || "org";

  // Org + membresía owner en una transacción: nunca queda una org sin dueño.
  const slug = await db.transaction(async (tx) => {
    // Si el slug está cogido, probamos con un sufijo aleatorio.
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate =
        attempt === 0
          ? baseSlug
          : `${baseSlug}-${randomBytes(3).toString("hex")}`;

      const [org] = await tx
        .insert(organizations)
        .values({ name, slug: candidate })
        .onConflictDoNothing({ target: organizations.slug })
        .returning({ id: organizations.id, slug: organizations.slug });

      if (org) {
        await tx.insert(organizationMembers).values({
          organizationId: org.id,
          userId: user.id,
          role: "owner",
        });
        return org.slug;
      }
    }
    return null;
  });

  if (!slug) {
    return {
      message: "No se pudo crear la organización. Inténtalo de nuevo.",
      values,
    };
  }

  redirect(`/orgs/${slug}`);
}
