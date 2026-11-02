import { createClient } from "@supabase/supabase-js";

/** Publishable-key client for public, read-only content reads on the server. */
export function publicClient() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
