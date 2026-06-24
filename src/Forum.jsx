import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured } from "./supabase.js";
import { Avatar } from "./avatar.jsx";
import { getProfileMap } from "./profiles.js";

/* ECHOMAIL — a real, shared message board backed by Supabase.
   Anyone may read; only enlisted comrades may post (enforced by RLS).
   author_handle is denormalised onto rows so the board renders with no joins. */
function fmt(ts) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function Forum({ auth, onBack }) {
  const { session, handle } = auth;
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null); // current thread row
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [people, setPeople] = useState({}); // author_id -> profile (avatar/handle)

  // Merge any author profiles we don't yet have, so avatars render.
  const ensurePeople = useCallback(async (ids) => {
    const missing = ids.filter((id) => id && !people[id]);
    if (!missing.length) return;
    const map = await getProfileMap(missing);
    setPeople((prev) => ({ ...prev, ...map }));
  }, [people]);

  // Render an avatar for a forum row, preferring the live profile (which may
  // carry an uploaded pic) and falling back to the row's denormalised handle.
  const rowAvatar = (row, className) => {
    const p = people[row.author_id];
    return (
      <Avatar
        className={className}
        url={p?.avatar_url}
        seed={p?.handle || row.author_handle}
        avatarSeed={p?.avatar_seed}
        alt=""
      />
    );
  };

  // New-thread + reply drafts
  const [newTitle, setNewTitle] = useState("");
  const [draft, setDraft] = useState("");

  const loadThreads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) setErr(error.message);
    else {
      setThreads(data || []);
      ensurePeople((data || []).map((t) => t.author_id));
    }
    setLoading(false);
  }, [ensurePeople]);

  const openThread = useCallback(async (thread) => {
    setActive(thread);
    setPosts([]);
    setErr(null);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    if (error) setErr(error.message);
    else {
      setPosts(data || []);
      ensurePeople((data || []).map((p) => p.author_id));
    }
  }, [ensurePeople]);

  useEffect(() => {
    if (isConfigured) loadThreads();
  }, [loadThreads]);

  async function createThread(e) {
    e.preventDefault();
    if (!newTitle.trim() || !draft.trim()) return;
    setBusy(true);
    setErr(null);
    const { data: t, error } = await supabase
      .from("threads")
      .insert({ title: newTitle.trim(), author_id: session.user.id, author_handle: handle })
      .select()
      .single();
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    await supabase.from("posts").insert({
      thread_id: t.id, author_id: session.user.id, author_handle: handle, body: draft.trim(),
    });
    setNewTitle("");
    setDraft("");
    setBusy(false);
    await loadThreads();
    await openThread(t);
  }

  async function reply(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("posts").insert({
      thread_id: active.id, author_id: session.user.id, author_handle: handle, body: draft.trim(),
    });
    if (error) setErr(error.message);
    else {
      setDraft("");
      await openThread(active);
    }
    setBusy(false);
  }

  if (!isConfigured) {
    return (
      <div className="board" onClick={onBack}>
        <h1 className="board-title">ECHOMAIL</h1>
        <p className="board-note err">
          The board is offline — no backend configured. Once the operator wires
          up Supabase, the forum goes live for the whole collective.
        </p>
        <div className="page-foot">— press 0 or ESC to return to the main menu —</div>
      </div>
    );
  }

  /* ── Thread view ─────────────────────────────────────────────── */
  if (active) {
    return (
      <div className="board">
        <div className="board-bar">
          <button className="bbs-btn alt" onClick={() => { setActive(null); setDraft(""); }}>
            ◄ ALL THREADS
          </button>
          <span className="board-crumb">ECHOMAIL / {active.title}</span>
        </div>

        <div className="forum-posts">
          {posts.map((p) => (
            <article key={p.id} className="post">
              <header className="post-head">
                <span className="post-who">
                  {rowAvatar(p, "avatar-sm")}
                  <span className="post-author">{p.author_handle || "anon"}</span>
                </span>
                <span className="post-date">{fmt(p.created_at)}</span>
              </header>
              <pre className="post-body">{p.body}</pre>
            </article>
          ))}
          {posts.length === 0 && <p className="board-note">No messages yet. Break the silence.</p>}
        </div>

        {err && <div className="board-note err">{err}</div>}

        {session ? (
          <form className="bbs-form" onSubmit={reply}>
            <label>
              <span>REPLY as {handle || "comrade"}</span>
              <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Transmit to the collective…" />
            </label>
            <div className="board-actions">
              <button className="bbs-btn" type="submit" disabled={busy}>{busy ? "…POSTING" : "POST REPLY"}</button>
            </div>
          </form>
        ) : (
          <p className="board-note">ENLIST (menu item 5) to join the conversation.</p>
        )}
      </div>
    );
  }

  /* ── Thread list ─────────────────────────────────────────────── */
  return (
    <div className="board">
      <div className="board-bar">
        <h1 className="board-title">ECHOMAIL</h1>
        <button className="bbs-btn alt" onClick={onBack}>◄ MENU</button>
      </div>
      <p className="board-note">The people's message board. Anyone may read; enlisted comrades may post.</p>

      {loading && <p className="board-note">…loading echomail</p>}
      {err && <div className="board-note err">{err}</div>}

      <ul className="thread-list">
        {threads.map((t) => (
          <li key={t.id}>
            <button className="thread-row" onClick={() => openThread(t)}>
              {rowAvatar(t, "avatar-sm")}
              <span className="thread-title">{t.title}</span>
              <span className="thread-meta">{t.author_handle || "anon"} · {fmt(t.created_at)}</span>
            </button>
          </li>
        ))}
        {!loading && threads.length === 0 && <li className="board-note">No threads yet. Start one.</li>}
      </ul>

      {session ? (
        <form className="bbs-form newthread" onSubmit={createThread}>
          <h2 className="board-sub">+ NEW THREAD</h2>
          <label>
            <span>SUBJECT</span>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={120} placeholder="re: THE LIST" />
          </label>
          <label>
            <span>MESSAGE</span>
            <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Address the collective…" />
          </label>
          <div className="board-actions">
            <button className="bbs-btn" type="submit" disabled={busy}>{busy ? "…POSTING" : "POST THREAD"}</button>
          </div>
        </form>
      ) : (
        <p className="board-note">ENLIST (menu item 5) to start a thread.</p>
      )}

      <div className="page-foot">— press 0 or ESC to return to the main menu —</div>
    </div>
  );
}
