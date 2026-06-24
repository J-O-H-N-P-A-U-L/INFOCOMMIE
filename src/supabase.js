import { createClient } from "@supabase/supabase-js";

// These are inlined at build time by Vite. The anon key is meant to be public
// (Row Level Security on the database is what protects the data, not secrecy of
// this key). See supabase/schema.sql for the tables + policies, and .env.example
// for local setup. In CI they come from GitHub Actions secrets — see deploy.yml.
// Defaults are the live INFOCOMMIE project. These are public by design — the
// publishable/anon key is meant to ship in the client bundle, and Row Level
// Security (supabase/schema.sql) is what protects the data, not key secrecy.
// Env vars override them (useful for a staging project or a fork).
const DEFAULT_URL = "https://lnnqofirrlvzlgelskik.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_X4tzBTQbtHI4Nt1RfR26EQ_F4gyrvX_";

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

// If the keys are missing (e.g. a fork without secrets configured), the UI shows
// an "offline" notice instead of throwing — the rest of the BBS still works.
export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
