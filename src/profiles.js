import { supabase } from "./supabase.js";

// Select the avatar columns when they exist, but fall back gracefully if the
// avatar migration (supabase/avatars.sql) hasn't been run yet — so the board
// keeps working with generated badges in the meantime.
const FULL = "id,handle,avatar_url,avatar_seed";
const BASE = "id,handle";

export async function getProfile(id) {
  if (!id) return null;
  let { data, error } = await supabase.from("profiles").select(FULL).eq("id", id).maybeSingle();
  if (error) ({ data } = await supabase.from("profiles").select(BASE).eq("id", id).maybeSingle());
  return data || null;
}

export async function getProfileMap(ids) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {};
  let { data, error } = await supabase.from("profiles").select(FULL).in("id", uniq);
  if (error) ({ data } = await supabase.from("profiles").select(BASE).in("id", uniq));
  const map = {};
  (data || []).forEach((p) => (map[p.id] = p));
  return map;
}
