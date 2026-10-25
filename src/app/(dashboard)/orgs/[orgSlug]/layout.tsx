import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { requireOrgMember } from "@/features/organizations/authz";

const ROLE_LABEL = {
  owner: "Propietario",
  admin: "Admin",
  member: "Miembro",
  viewer: "Lector",
} as const;

// Ojo: el layout protege la UI, pero no sustituye al check en cada página
// y Server Action (los layouts no se re-renderizan en cada navegación).
export default async function OrgLayout({
  children,
  params,
}: LayoutProps<"/orgs/[orgSlug]">) {
  const { orgSlug } = await params;
  const { session, organization, role } = await requireOrgMember(orgSlug);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href={`/orgs/${organization.slug}`} className="font-semibold">
            {organization.name}
          </Link>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {ROLE_LABEL[role]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{session.user.name}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
