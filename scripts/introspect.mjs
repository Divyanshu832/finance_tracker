// One-shot introspection: dumps tables, columns, triggers, functions.
const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_REF || "fpqqftgnvkhhywemcpak";
if (!PAT) { console.error("SUPABASE_PAT env var required"); process.exit(1); }

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

console.log("=== TABLES + COLUMNS ===");
const cols = await q(`
  select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public'
  order by table_name, ordinal_position
`);
let last = "";
for (const r of cols) {
  if (r.table_name !== last) { console.log(`\n[${r.table_name}]`); last = r.table_name; }
  console.log(`  ${r.column_name.padEnd(28)} ${r.data_type}${r.is_nullable === "NO" ? " NOT NULL" : ""}${r.column_default ? "  default " + r.column_default : ""}`);
}

console.log("\n\n=== TRIGGERS ===");
const trigs = await q(`
  select event_object_table as tbl, trigger_name, event_manipulation as event, action_timing as timing
  from information_schema.triggers
  where trigger_schema = 'public'
  order by tbl, trigger_name
`);
for (const t of trigs) console.log(`  ${t.tbl.padEnd(28)} ${t.timing} ${t.event} -> ${t.trigger_name}`);

console.log("\n\n=== FUNCTIONS ===");
const fns = await q(`
  select routine_name, data_type as returns
  from information_schema.routines
  where routine_schema = 'public' and routine_type = 'FUNCTION'
  order by routine_name
`);
for (const f of fns) console.log(`  ${f.routine_name.padEnd(40)} returns ${f.returns}`);

console.log("\n\n=== VIEWS ===");
const views = await q(`
  select table_name from information_schema.views where table_schema = 'public'
`);
for (const v of views) console.log(`  ${v.table_name}`);

console.log("\n\n=== ENUMS ===");
const enums = await q(`
  select t.typname as name, e.enumlabel as label
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
  order by t.typname, e.enumsortorder
`);
if (enums.length === 0) console.log("  (none — all 'enum-like' columns use CHECK constraints)");
else {
  let prev = "";
  for (const r of enums) {
    if (r.name !== prev) { console.log(`\n  ${r.name}`); prev = r.name; }
    console.log(`    - ${r.label}`);
  }
}

console.log("\n\n=== INDEXES ===");
const idx = await q(`
  select tablename, indexname, indexdef
  from pg_indexes where schemaname = 'public'
  order by tablename, indexname
`);
for (const i of idx) console.log(`  ${i.tablename.padEnd(28)} ${i.indexname}`);
