import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    // Nuestras tablas son `users`, `sessions`... y Better Auth espera `user`, `session`...
    usePlural: true,
  }),
  advanced: {
    database: {
      // Las PK son columnas uuid; sin esto Better Auth genera ids alfanuméricos
      // que Postgres rechazaría al insertar.
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
    },
    google: {
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    },
  },
  plugins: [nextCookies()], // debe ir el último del array — permite que las Server Actions seteen cookies
});
