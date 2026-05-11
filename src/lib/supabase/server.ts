import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

// Single-user app: every request uses the service role on the server.
// This bypasses RLS entirely — there's only one ledger anyway.
// We intentionally skip the Database generic; our hand-written row types in
// ./types.ts are used at call sites instead.
export const getSupabase = cache((): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
});
