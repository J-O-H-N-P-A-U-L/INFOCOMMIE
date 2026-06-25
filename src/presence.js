import { useEffect, useState } from "react";
import { supabase, isConfigured } from "./supabase.js";

// Live "who's online" via Supabase Realtime Presence (no DB table required —
// presence state lives in the Realtime server for the duration of a connection).
//
// Every visitor subscribes to the shared "online" channel so they can read the
// roster. Logged-in comrades additionally track() themselves (handle + when
// they connected), so the list shows ACTUAL people currently connected. When a
// tab closes or drops, Realtime removes them automatically.
//
// Mount this once, high in the tree (App), so a comrade counts as online for as
// long as the app is open — not only while viewing the WHO page.
export function usePresence(session, handle) {
  const [online, setOnline] = useState([]);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!isConfigured) return;

    // Presence key groups a person's connections; using the uid means multiple
    // tabs collapse to one entry. Guests observe only and never track.
    const key = userId || `guest-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel("online", { config: { presence: { key } } });

    const sync = () => {
      const state = channel.presenceState();
      const seen = new Map(); // uid|handle -> meta, dedupes multi-tab
      for (const metas of Object.values(state)) {
        for (const m of metas) {
          if (m.handle) seen.set(m.user_id || m.handle, m);
        }
      }
      setOnline(
        [...seen.values()].sort((a, b) => a.handle.localeCompare(b.handle))
      );
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && userId) {
          await channel.track({
            user_id: userId,
            handle: handle || session.user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, handle]);

  return online;
}
