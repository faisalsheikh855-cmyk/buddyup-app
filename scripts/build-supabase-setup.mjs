import { readFileSync, writeFileSync } from "node:fs";

const sections = [
  ["SCHEMA, FUNCTIONS, AND TRIGGERS", "supabase/schema.sql"],
  ["ROW LEVEL SECURITY", "supabase/rls.sql"],
  ["STORAGE BUCKETS AND POLICIES", "supabase/storage.sql"],
];

const output = sections
  .map(([title, path]) => [
    `-- ============================================================`,
    `-- ${title}`,
    `-- Source: ${path}`,
    `-- ============================================================`,
    readFileSync(path, "utf8").trim(),
  ].join("\n"))
  .join("\n\n");

writeFileSync("supabase/setup.sql", `${output}\n`);
console.log("Generated supabase/setup.sql");
