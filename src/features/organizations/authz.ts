import "server-only";

import { notFound } from "next/navigation";
import { memberRoleEnum } from "@/lib/db/schema";
import { requireSession } from "@/features/auth/session";
import { getMembershipBySlug } from "./queries";

export type MemberRole = (typeof memberRoleEnum.enumValues)[number];

// Jerarquía: cada rol puede todo lo que puede el anterior.
const ROLE_RANK: Record<MemberRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function hasRole(role: MemberRole, minRole: MemberRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

// Para páginas y Server Actions dentro de /orgs/[orgSlug].
// Si el usuario no es miembro o su rol no llega al mínimo responde 404:
// así no revelamos si la organización existe.
export async function requireOrgMember(
  slug: string,
  minRole: MemberRole = "viewer",
) {
  const session = await requireSession();
  const membership = await getMembershipBySlug(session.user.id, slug);

  if (!membership || !hasRole(membership.role, minRole)) notFound();

  return { session, ...membership };
}
