import "server-only";

import { cache } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";

// Organizaciones a las que pertenece el usuario (sin las borradas).
export async function getUserOrganizations(userId: string) {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizationMembers.organizationId, organizations.id),
    )
    .where(
      and(
        eq(organizationMembers.userId, userId),
        isNull(organizations.deletedAt),
      ),
    )
    .orderBy(asc(organizationMembers.createdAt));
}

// Membresía del usuario en la organización con ese slug, o null si no es miembro
// (o la organización no existe / está borrada). Cacheada por request porque
// el layout y la página de una misma ruta la piden ambos.
export const getMembershipBySlug = cache(
  async (userId: string, slug: string) => {
    const [row] = await db
      .select({
        role: organizationMembers.role,
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        },
      })
      .from(organizationMembers)
      .innerJoin(
        organizations,
        eq(organizationMembers.organizationId, organizations.id),
      )
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizations.slug, slug),
          isNull(organizations.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  },
);
