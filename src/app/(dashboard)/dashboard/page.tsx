import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { requireSession } from "@/features/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

// Provisional: sirve para probar el flujo de auth. Se reemplaza en la fase 4.
export default async function DashboardPage() {
  const { user } = await requireSession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <p>
        Sesión iniciada como <strong>{user.name}</strong> ({user.email})
      </p>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
