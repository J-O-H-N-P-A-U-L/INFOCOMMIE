import { supabase } from "./supabase.js";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

// Upload a picture to the `avatars` bucket (one file per comrade, in a folder
// named by their uid so RLS can scope writes), then point the profile at it.
export async function uploadAvatar(userId, file) {
  if (!file.type.startsWith("image/")) throw new Error("That isn't an image file.");
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Image too large — keep it under 2 MB.");

  const path = `${userId}/avatar`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`; // bust CDN cache on re-upload

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (profErr) throw profErr;
  return url;
}

// Drop any uploaded picture and re-roll the generated badge (bumps the seed).
export async function shuffleBadge(userId, currentSeed = 0) {
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, avatar_seed: (currentSeed || 0) + 1 })
    .eq("id", userId);
  if (error) throw error;
}
