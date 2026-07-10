/**
 * Apply Supabase SQL migrations and seed the admin user.
 * Requires SUPABASE_DB_PASSWORD in .env (Database password from Supabase dashboard).
 *
 * Usage: npx tsx scripts/setup-database.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_PASSWORD,
  SUPABASE_DB_POOLER_REGION,
  ADMIN_EMAIL = "admin@lem3ansra.dz",
  ADMIN_PASSWORD = "Admin@123456",
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

function buildConnectionStrings(password: string): string[] {
  const encoded = encodeURIComponent(password);
  const urls: string[] = [];

  if (SUPABASE_DB_POOLER_REGION) {
    urls.push(
      `postgresql://postgres.${projectRef}:${encoded}@aws-0-${SUPABASE_DB_POOLER_REGION}.pooler.supabase.com:6543/postgres`,
    );
  }

  urls.push(
    `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${encoded}@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encoded}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encoded}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encoded}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  );

  return [...new Set(urls)];
}

async function connectPg(password: string): Promise<pg.Client> {
  let lastError: unknown;

  for (const connectionString of buildConnectionStrings(password)) {
    const host = connectionString.split("@")[1] ?? connectionString;
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log(`Connected to database via ${host}`);
      return client;
    } catch (error) {
      lastError = error;
      console.warn(`Connection failed (${host}): ${(error as Error).message}`);
      await client.end().catch(() => undefined);
    }
  }

  throw lastError ?? new Error("Could not connect to Supabase Postgres");
}

async function applyMigrations(): Promise<void> {
  if (!SUPABASE_DB_PASSWORD) {
    console.warn("SUPABASE_DB_PASSWORD not set — skipping SQL migrations.");
    console.warn("Apply migrations manually via Supabase SQL editor or set SUPABASE_DB_PASSWORD.");
    return;
  }

  const client = await connectPg(SUPABASE_DB_PASSWORD);

  const migrationsDir = join(__dirname, "../supabase/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`Applying migration: ${file}`);
    await client.query(sql);
  }

  await client.end();
  console.log("Migrations applied successfully.");
}

async function seedAdmin(): Promise<void> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers.users.find((u) => u.email === ADMIN_EMAIL);

  let userId: string;

  if (existing) {
    userId = existing.id;
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Admin" },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create admin user: ${error?.message}`);
    }

    userId = data.user.id;
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }

  await supabase.from("profiles").upsert({
    id: userId,
    name: "Admin",
    language: "fr",
    is_active: true,
  });

  await supabase.from("user_roles").delete().eq("user_id", userId);
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role: "admin" });

  if (roleError) {
    throw new Error(`Failed to assign admin role: ${roleError.message}`);
  }

  await supabase.from("store_settings").upsert({
    id: 1,
    contact_name: "Lem3ansra n Jeddi",
    whatsapp_number: "",
    email: "",
    phone: "",
    address: "",
  });

  console.log("Admin role and default store settings configured.");
}

async function main(): Promise<void> {
  await applyMigrations();
  await seedAdmin();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
