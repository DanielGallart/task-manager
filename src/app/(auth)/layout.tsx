import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Si ya hay sesión válida, no tiene sentido mostrar login/registro.
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      {children}
    </main>
  );
}
