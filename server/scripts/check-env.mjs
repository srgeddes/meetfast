import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
};

const hasPlaceholder = (value) => value && value.includes("<") && value.includes(">");

const results = Object.entries(env).map(([key, value]) => ({
  key,
  value: value ? "set" : "missing",
  placeholder: hasPlaceholder(value),
}));

console.log("Environment variable check:");
for (const result of results) {
  const status = [result.value];
  if (result.placeholder) {
    status.push("placeholder value detected");
  }
  console.log(`- ${result.key}: ${status.join(", ")}`);
}

const supabaseReady =
  env.NEXT_PUBLIC_SUPABASE_URL &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  !hasPlaceholder(env.NEXT_PUBLIC_SUPABASE_URL) &&
  !hasPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY);

if (supabaseReady) {
  console.log("\nTesting Supabase service role connectivity...");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      console.error("Supabase admin SDK error:", error.message);
    } else {
      console.log(`Supabase admin reachable. Users fetched: ${data.users.length}`);
    }
  } catch (err) {
    console.error("Supabase connectivity failed:", err.message);
  }
} else {
  console.log("\nSkipping Supabase connectivity test (missing or placeholder credentials).");
}

const prismaReady =
  env.DATABASE_URL && env.DIRECT_URL && !hasPlaceholder(env.DATABASE_URL) && !hasPlaceholder(env.DIRECT_URL);

if (prismaReady) {
  console.log("\nTesting Prisma database connectivity...");
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Prisma connected successfully.");
  } catch (err) {
    console.error("Prisma connectivity failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
} else {
  console.log("\nSkipping Prisma connectivity test (missing or placeholder credentials).");
}
