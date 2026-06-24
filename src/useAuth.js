import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured } from "./supabase.js";
import { getProfile } from "./profiles.js";

// Subscribes to Supabase auth and resolves the signed-in comrade's profile
// (handle + avatar) from the `profiles` table. Returns { session, handle,
// profile, loading } plus signOut() and refreshProfile().
export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isConfigured);
  const handle = profile?.handle ?? null;

  useEffect(() => {
    if (!isConfigured) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    setProfile(await getProfile(session.user.id));
  }, [session]);

  useEffect(() => {
    let alive = true;
    if (!session?.user) {
      setProfile(null);
      return;
    }
    getProfile(session.user.id).then((p) => {
      if (alive) setProfile(p);
    });
    return () => {
      alive = false;
    };
  }, [session]);

  const signOut = useCallback(async () => {
    if (isConfigured) await supabase.auth.signOut();
  }, []);

  return { session, handle, profile, loading, signOut, refreshProfile };
}
