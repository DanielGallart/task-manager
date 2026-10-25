import type { Metadata } from "next";
import { requireOrgMember } from "@/features/organizations/authz";

export const metadata: Metadata = { title: "Proyectos" };

// Provisional: el listado de proyectos llega en el siguiente commit.
export default async function OrgHomePage({
  params,
}: PageProps<"/orgs/[orgSlug]">) {
  const { orgSlug } = await params;
  const { organization } = await requireOrgMember(orgSlug);

  return (
    <div className="mx-auto grid max-w-3xl gap-2">
      <h1 className="text-xl font-semibold">Proyectos</h1>
      <p className="text-sm text-muted-foreground">
        Todavía no hay proyectos en {organization.name}.
      </p>
    </div>
  );
}
