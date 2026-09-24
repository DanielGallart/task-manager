/**
 * Script de seed para poblar la base de datos con datos de prueba.
 *
 * Uso:
 *   npx tsx src/db/seed.ts
 *
 * Requiere que las migraciones ya estén aplicadas (npx drizzle-kit migrate)
 * y que tu conexión a Postgres (DATABASE_URL) esté disponible en .env
 */


import { db } from "./index"; // ajusta esta ruta a donde tengas tu cliente de Drizzle
import {
  users,
  organizations,
  organizationMembers,
  projects,
  taskStatuses,
  tasks,
} from "./schema";

async function seed() {
  console.log("🌱 Empezando seed...");

  // ---------- 1. Limpieza (opcional, útil para poder re-ejecutar el seed) ----------
  // El orden importa: primero las tablas hijas, luego las padre,
  // para no violar las foreign keys.
  await db.delete(tasks);
  await db.delete(taskStatuses);
  await db.delete(projects);
  await db.delete(organizationMembers);
  await db.delete(organizations);
  await db.delete(users);
  console.log("🧹 Tablas limpiadas");

  // ---------- 2. Usuarios ----------
  const [alice, bob, carol] = await db
    .insert(users)
    .values([
      { email: "alice@example.com", name: "Alice Martín" },
      { email: "bob@example.com", name: "Bob García" },
      { email: "carol@example.com", name: "Carol Fernández" },
    ])
    .returning();

  console.log(`👤 ${3} usuarios creados`);

  // ---------- 3. Organización ----------
  const [org] = await db
    .insert(organizations)
    .values({ name: "Mi Equipo", slug: "mi-equipo" })
    .returning();

  // Los tres usuarios pertenecen a la organización, con distintos roles
  await db.insert(organizationMembers).values([
    { organizationId: org.id, userId: alice.id, role: "owner" },
    { organizationId: org.id, userId: bob.id, role: "admin" },
    { organizationId: org.id, userId: carol.id, role: "member" },
  ]);

  console.log("🏢 Organización y membresías creadas");

  // ---------- 4. Proyecto ----------
  const [project] = await db
    .insert(projects)
    .values({
      organizationId: org.id,
      name: "Gestor de Tareas",
      key: "TASK",
      description: "Proyecto de ejemplo para desarrollo",
    })
    .returning();

  // ---------- 5. Estados del tablero ----------
  // El orden define la posición en el kanban (columna 0, 1, 2...)
  const [todo, inProgress, done] = await db
    .insert(taskStatuses)
    .values([
      { projectId: project.id, name: "To Do", order: 0 },
      { projectId: project.id, name: "In Progress", order: 1 },
      { projectId: project.id, name: "Done", order: 2 },
    ])
    .returning();

  console.log("📋 Proyecto y estados creados");

  // ---------- 6. Tareas de ejemplo ----------
  // Variamos prioridad, asignado y estado para tener un tablero
  // representativo con el que probar filtros, drag & drop, etc.
  await db.insert(tasks).values([
    {
      projectId: project.id,
      statusId: todo.id,
      title: "Configurar Auth.js",
      description: "Añadir login con email/password y OAuth",
      priority: "high",
      assigneeId: alice.id,
      reporterId: alice.id,
    },
    {
      projectId: project.id,
      statusId: todo.id,
      title: "Diseñar el tablero kanban",
      priority: "medium",
      assigneeId: bob.id,
      reporterId: alice.id,
    },
    {
      projectId: project.id,
      statusId: inProgress.id,
      title: "Modelo de datos con Drizzle",
      description: "Ya en marcha, casi terminado",
      priority: "high",
      assigneeId: alice.id,
      reporterId: alice.id,
    },
    {
      projectId: project.id,
      statusId: inProgress.id,
      title: "Componente de tarjeta de tarea",
      priority: "low",
      assigneeId: carol.id,
      reporterId: bob.id,
    },
    {
      projectId: project.id,
      statusId: done.id,
      title: "Setup inicial de Next.js",
      priority: "medium",
      assigneeId: bob.id,
      reporterId: bob.id,
    },
    {
      projectId: project.id,
      statusId: done.id,
      title: "Conexión a Postgres",
      priority: "urgent",
      assigneeId: alice.id,
      reporterId: alice.id,
    },
  ]);

  console.log("✅ 6 tareas de ejemplo creadas");
  console.log("🌱 Seed completado con éxito");
}

seed()
  .catch((err) => {
    console.error("❌ Error durante el seed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));