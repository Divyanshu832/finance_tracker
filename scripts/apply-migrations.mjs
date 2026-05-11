// One-shot: apply every supabase/migrations/*.sql against the project via
// the Management API.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_REF || "fpqqftgnvkhhywemcpak";
if (!PAT) { console.error("SUPABASE_PAT env var required"); process.exit(1); }

const DIR = new URL("../supabase/migrations/", import.meta.url);
const files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();

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
