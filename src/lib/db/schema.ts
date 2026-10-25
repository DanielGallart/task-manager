import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- ENUMS ----------
// Un enum de Postgres para el rol dentro de una organización.
// Lo usamos como enum real (no como string libre) para que la BD
// rechace valores inválidos a nivel de esquema, no solo en la app.
export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
  "viewer", // solo lectura
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

// ---------- USERS ----------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  image: text("image"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------- SESSIONS (Better Auth guarda las sesiones en BD, no en JWT) ----------
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
  }),
);

// ---------- ACCOUNTS (un registro por proveedor: "credential", "github", "google"...) ----------
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"), // aquí vive el hash cuando providerId = "credential"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("accounts_user_idx").on(table.userId),
  }),
);

// ---------- VERIFICATIONS (tokens de verificación de email / reset de contraseña) ----------
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------- ORGANIZATIONS ----------
// Multi-tenancy desde el día 1: cada proyecto pertenece a una organización,
// aunque al principio solo tengas una por usuario. Añadir esto después
// implicaría migrar todas las tablas hijas, así que lo hacemos ahora.
//
// Soft delete: organizations, projects y tasks no se borran físicamente,
// se marca `deletedAt`. Las queries deben filtrar con `isNull(tabla.deletedAt)`.
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Tabla puente: un usuario puede pertenecer a varias organizaciones,
// y cada organización tiene varios miembros con distintos roles.
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgUserIdx: index("org_members_org_idx").on(table.organizationId),
    // Un usuario solo puede ser miembro una vez de cada organización
    orgUserUnique: unique("org_members_org_user_unique").on(
      table.organizationId,
      table.userId,
    ),
  }),
);

// ---------- PROJECTS ----------
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    key: varchar("key", { length: 10 }).notNull(), // ej: "PROJ" para tickets tipo PROJ-123
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    orgIdx: index("projects_org_idx").on(table.organizationId),
    // La key identifica el proyecto en los tickets (PROJ-123): única por organización
    orgKeyUnique: unique("projects_org_key_unique").on(
      table.organizationId,
      table.key,
    ),
    // Necesario para que tasks pueda referenciar (project_id, organization_id)
    idOrgUnique: unique("projects_id_org_unique").on(
      table.id,
      table.organizationId,
    ),
  }),
);

// ---------- TASK STATUSES ----------
// En vez de un enum fijo (To Do/In Progress/Done), lo hacemos una tabla
// por proyecto para que cada equipo pueda personalizar su flujo, como en Jira real.
export const taskStatuses = pgTable(
  "task_statuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    order: integer("order").notNull().default(0), // posición en el tablero kanban
  },
  (table) => ({
    projectIdx: index("task_statuses_project_idx").on(table.projectId),
  }),
);

// ---------- TASKS ----------
// `organizationId` está desnormalizado (se podría sacar de projects) para poder
// filtrar por tenant sin joins. La FK compuesta de abajo garantiza que siempre
// coincide con la organización del proyecto.
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    statusId: uuid("status_id")
      .notNull()
      .references(() => taskStatuses.id),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    assigneeId: uuid("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    projectOrgFk: foreignKey({
      columns: [table.projectId, table.organizationId],
      foreignColumns: [projects.id, projects.organizationId],
      name: "tasks_project_org_fk",
    }).onDelete("cascade"),
    orgIdx: index("tasks_org_idx").on(table.organizationId),
    projectIdx: index("tasks_project_idx").on(table.projectId),
    statusIdx: index("tasks_status_idx").on(table.statusId),
    assigneeIdx: index("tasks_assignee_idx").on(table.assigneeId),
  }),
);

// ---------- RELATIONS ----------
// Esto no crea tablas ni columnas: le dice al query builder de Drizzle
// cómo navegar entre entidades (para poder hacer db.query.tasks.findMany({ with: { assignee: true } }))
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
  assignedTasks: many(tasks, { relationName: "assignee" }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  projects: many(projects),
  tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  tasks: many(tasks),
  statuses: many(taskStatuses),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  }),
);

export const taskStatusesRelations = relations(
  taskStatuses,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [taskStatuses.projectId],
      references: [projects.id],
    }),
    tasks: many(tasks),
  }),
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  status: one(taskStatuses, {
    fields: [tasks.statusId],
    references: [taskStatuses.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  reporter: one(users, { fields: [tasks.reporterId], references: [users.id] }),
}));
