import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured } from "./supabase.js";

// Subscribes to Supabase auth and resolves the signed-in comrade's handle from
// the `profiles` table. Returns { session, handle, loading } plus a signOut().
export function useAuth() {
  const [session, setSession] = useState(null);
  const [handle, setHandle] = useState(null);
  const [loading, setLoading] = useState(isConfigured);

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

  useEffect(() => {
    if (!session?.user) {
      setHandle(null);
      return;
    }
    let alive = true;
    supabase
      .from("profiles")
      .select("handle")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setHandle(data?.handle ?? null);
      });
    return () => {
      alive = false;
    };
  }, [session]);

  const signOut = useCallback(async () => {
    if (isConfigured) await supabase.auth.signOut();
  }, []);

  return { session, handle, loading, signOut };
}
