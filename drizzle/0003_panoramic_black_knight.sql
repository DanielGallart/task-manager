ALTER TYPE "public"."member_role" ADD VALUE 'viewer';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
-- Editado a mano: se añade nullable, se rellena desde projects y luego se hace NOT NULL,
-- para que no falle si tasks ya tiene filas.
ALTER TABLE "tasks" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
UPDATE "tasks" SET "organization_id" = "projects"."organization_id" FROM "projects" WHERE "tasks"."project_id" = "projects"."id";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Editado a mano: el UNIQUE debe existir antes de la FK compuesta que lo referencia.
ALTER TABLE "projects" ADD CONSTRAINT "projects_id_org_unique" UNIQUE("id","organization_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_org_fk" FOREIGN KEY ("project_id","organization_id") REFERENCES "public"."projects"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_org_idx" ON "tasks" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "org_members_org_user_unique" UNIQUE("organization_id","user_id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_key_unique" UNIQUE("organization_id","key");