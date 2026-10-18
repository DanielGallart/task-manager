import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Validación real de la sesión (consulta a BD). El proxy solo hace una
// comprobación optimista de la cookie; esto es lo que hay que llamar en
// cada página, Server Action y Route Handler protegidos.
// `cache` evita repetir la consulta dentro de un mismo request.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
