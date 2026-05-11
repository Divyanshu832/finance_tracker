// Apply supabase/migrations/*.sql against the project via the Management API.
//   node scripts/apply-migrations.mjs                  -> all files
//   node scripts/apply-migrations.mjs 0006             -> just 0006_*.sql
//   node scripts/apply-migrations.mjs 0006_emergency_fund.sql
//   node scripts/apply-migrations.mjs --latest         -> highest-numbered file
import { readdir, readFile } from "node:fs/promises";

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_REF || "fpqqftgnvkhhywemcpak";
if (!PAT) { console.error("SUPABASE_PAT env var required"); process.exit(1); }

const DIR = new URL("../supabase/migrations/", import.meta.url);
const all = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();

const arg = process.argv[2];
let files;
if (!arg) files = all;
else if (arg === "--latest") files = [all[all.length - 1]];
else files = all.filter((f) => f === arg || f.startsWith(arg));

if (files.length === 0) {
  console.error(`No migration matches "${arg}". Available:\n  ${all.join("\n  ")}`);
  process.exit(1);
}

for (const f of files) {
  const sql = await readFile(new URL(f, DIR), "utf8");
  console.log(`\n▶ ${f}  (${sql.length} bytes)`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
  console.log(`✓ applied`);
}
console.log("\nAll migrations applied.");
