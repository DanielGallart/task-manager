import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/session";
import { getUserOrganizations } from "@/features/organizations/queries";

// Punto de entrada tras login/registro/OAuth: lleva a la primera organización
// del usuario, o al onboarding si aún no pertenece a ninguna.
export default async function DashboardPage() {
  const { user } = await requireSession();
  const [firstOrg] = await getUserOrganizations(user.id);

  redirect(firstOrg ? `/orgs/${firstOrg.slug}` : "/onboarding");
}
