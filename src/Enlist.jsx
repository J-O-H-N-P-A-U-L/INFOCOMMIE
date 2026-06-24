import { useState } from "react";
import { supabase, isConfigured } from "./supabase.js";

const HANDLE_RE = /^[a-z0-9._]{3,24}$/i;

/* ENLIST — real account signup / login backed by Supabase auth.
   On register we create the auth user, then write a row into `profiles`
   holding the chosen handle (used to sign forum posts). */
export default function Enlist({ auth, onBack }) {
  const { session, handle, signOut } = auth;
  const [mode, setMode] = useState("register"); // "register" | "login"
  const [form, setForm] = useState({ handle: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { kind: "err"|"ok", text }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (mode === "register" && !HANDLE_RE.test(form.handle)) {
      setMsg({ kind: "err", text: "Handle: 3-24 chars, letters/digits/._ only." });
      return;
    }
    if (form.password.length < 6) {
      setMsg({ kind: "err", text: "Passphrase must be at least 6 characters." });
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { handle: form.handle.trim() } },
        });
        if (error) throw error;

        // If email confirmation is OFF, we get a session immediately and can
        // write the profile now. If it's ON, the row is written on first login.
        if (data.session && data.user) {
          await supabase
            .from("profiles")
            .upsert({ id: data.user.id, handle: form.handle.trim() });
          setMsg({ kind: "ok", text: "Welcome to the collective, comrade." });
        } else {
          setMsg({
            kind: "ok",
            text: "Check your inbox to confirm, then LOG IN below.",
          });
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        // Make sure a profile row exists (covers confirm-by-email signups).
        if (data.user) {
          const meta = data.user.user_metadata || {};
          if (meta.handle) {
            await supabase
              .from("profiles")
              .upsert({ id: data.user.id, handle: meta.handle }, { onConflict: "id", ignoreDuplicates: true });
          }
        }
        setMsg({ kind: "ok", text: "Authenticated. Solidarity." });
      }
    } catch (err) {
      setMsg({ kind: "err", text: err.message || "Transmission failed." });
    } finally {
      setBusy(false);
    }
  }

  if (!isConfigured) {
    return (
      <div className="board" onClick={onBack}>
        <h1 className="board-title">ENLIST</h1>
        <p className="board-note err">
          Roster is offline — the board operator hasn't wired up the backend
          (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Solidarity is still free.
        </p>
        <div className="page-foot">— press 0 or ESC to return to the main menu —</div>
      </div>
    );
  }

  // Already enlisted.
  if (session) {
    return (
      <div className="board">
        <h1 className="board-title">ENLISTED</h1>
        <p className="board-note">
          You are signed in as <b>{handle || session.user.email}</b>. The FORUM
          is open to you, comrade. There are no dues — only solidarity.
        </p>
        <div className="board-actions">
          <button className="bbs-btn" onClick={signOut}>LOG OUT</button>
          <button className="bbs-btn alt" onClick={onBack}>◄ MENU</button>
        </div>
      </div>
    );
  }

  return (
    <div className="board">
      <h1 className="board-title">{mode === "register" ? "ENLIST" : "LOG IN"}</h1>
      <p className="board-note">
        {mode === "register"
          ? "Take a handle, fall in with your fellow imps. No dues, only solidarity."
          : "Welcome back, comrade. Identify yourself."}
      </p>

      <form className="bbs-form" onSubmit={submit}>
        {mode === "register" && (
          <label>
            <span>HANDLE</span>
            <input
              value={form.handle}
              onChange={set("handle")}
              autoCapitalize="off"
              autoComplete="username"
              spellCheck="false"
              placeholder="d.nostalgia"
            />
          </label>
        )}
        <label>
          <span>EMAIL</span>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            autoCapitalize="off"
            autoComplete="email"
            spellCheck="false"
            placeholder="comrade@example.org"
          />
        </label>
        <label>
          <span>PASSPHRASE</span>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder="••••••"
          />
        </label>

        {msg && <div className={"board-note " + (msg.kind === "err" ? "err" : "ok")}>{msg.text}</div>}

        <div className="board-actions">
          <button className="bbs-btn" type="submit" disabled={busy}>
            {busy ? "…SENDING" : mode === "register" ? "JOIN THE COLLECTIVE" : "AUTHENTICATE"}
          </button>
          <button
            className="bbs-btn alt"
            type="button"
            onClick={() => {
              setMode((m) => (m === "register" ? "login" : "register"));
              setMsg(null);
            }}
          >
            {mode === "register" ? "have an account? LOG IN" : "new here? ENLIST"}
          </button>
        </div>
      </form>

      <div className="page-foot">— press 0 or ESC to return to the main menu —</div>
    </div>
  );
}
