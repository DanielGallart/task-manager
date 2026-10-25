"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInAction } from "../actions";
import type { AuthFormState } from "../schema";
import { SocialButtons } from "./social-buttons";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Accede con tu email o con tu cuenta de GitHub o Google</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={formAction} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.values?.email}
              aria-invalid={!!state.errors?.email}
              aria-describedby={state.errors?.email ? "email-error" : undefined}
            />
            {state.errors?.email && (
              <p id="email-error" className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={!!state.errors?.password}
              aria-describedby={state.errors?.password ? "password-error" : undefined}
            />
            {state.errors?.password && (
              <p id="password-error" className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            )}
          </div>
          {state.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
        </div>
        <SocialButtons />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        ¿No tienes cuenta?&nbsp;
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Regístrate
        </Link>
      </CardFooter>
    </Card>
  );
}
