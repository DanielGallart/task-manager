"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Provider = "github" | "google";

const providers: { id: Provider; label: string }[] = [
  { id: "github", label: "Continuar con GitHub" },
  { id: "google", label: "Continuar con Google" },
];

export function SocialButtons() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setPending(provider);
    setError(null);
    // Si va bien, el navegador sale hacia el proveedor y no volvemos aquí.
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
      if (!error) return;
      console.error("[auth] signIn.social", error);
    } catch (err) {
      // Errores de red u otros que el cliente lanza en vez de devolver.
      console.error("[auth] signIn.social", err);
    }
    setError("No se pudo iniciar sesión con ese proveedor");
    setPending(null);
  }

  return (
    <div className="grid gap-2">
      {providers.map(({ id, label }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => signIn(id)}
        >
          {pending === id ? "Redirigiendo..." : label}
        </Button>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
