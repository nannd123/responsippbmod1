import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;


const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL belum diatur.");
}

if (!supabaseKey) {
  throw new Error(
    "SUPABASE_SECRET_KEY atau SUPABASE_SERVICE_ROLE_KEY belum diatur."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
