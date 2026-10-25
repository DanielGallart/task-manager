import type { Metadata } from "next";
import { requireSession } from "@/features/auth/session";
import { CreateOrganizationForm } from "@/features/organizations/components/create-organization-form";

export const metadata: Metadata = { title: "Crear organización" };

export default async function OnboardingPage() {
  await requireSession();

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <CreateOrganizationForm />
    </main>
  );
}
