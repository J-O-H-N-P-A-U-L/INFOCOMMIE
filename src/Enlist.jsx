import { useState, useRef } from "react";
import { supabase, isConfigured } from "./supabase.js";
import { Avatar } from "./avatar.jsx";
import { uploadAvatar, shuffleBadge } from "./avatarStore.js";

const HANDLE_RE = /^[a-z0-9._]{3,24}$/i;

/* ENLIST — real account signup / login backed by Supabase auth.
   On register we create the auth user, then write a row into `profiles`
   holding the chosen handle (used to sign forum posts). */
export default function Enlist({ auth, onBack }) {
  const { session, handle, profile, signOut, refreshProfile } = auth;
  const [mode, setMode] = useState("register"); // "register" | "login"
  const [form, setForm] = useState({ handle: "", email: "", password: "", code: "" });
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { kind: "err"|"ok", text }
  const [avBusy, setAvBusy] = useState(false);
  const [avErr, setAvErr] = useState(null);
  const fileRef = useRef(null);

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvErr(null);
    setAvBusy(true);
    try {
      await uploadAvatar(session.user.id, file);
      await refreshProfile();
    } catch (err) {
      setAvErr(err.message || "Upload failed (has the avatars bucket been set up?).");
    } finally {
      setAvBusy(false);
    }
  }

  async function onShuffle() {
    setAvErr(null);
    setAvBusy(true);
    try {
      await shuffleBadge(session.user.id, profile?.avatar_seed);
      await refreshProfile();
    } catch (err) {
      setAvErr(err.message || "Could not re-roll badge.");
    } finally {
      setAvBusy(false);
    }
  }

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
        // write the profile now. If it's ON, Supabase emails a 6-digit code and
        // we switch to the confirm step (see verifyCode). We use an OTP *code*
        // rather than a magic link because Outlook/Hotmail "Safe Links" pre-fetch
        // and consume single-use links, producing otp_expired before the user
        // even clicks. A typed code can't be consumed by a scanner.
        if (data.session && data.user) {
          await supabase
            .from("profiles")
            .upsert({ id: data.user.id, handle: form.handle.trim() });
          setMsg({ kind: "ok", text: "Welcome to the collective, comrade." });
        } else {
          setAwaitingCode(true);
          setMsg({
            kind: "ok",
            text: "A 6-digit code was transmitted to your email. Enter it below.",
          });
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

  // Confirm a freshly-registered account with the 6-digit code from the email.
  // A successful verify establishes a session (useAuth picks it up and flips us
  // into the ENLISTED view), so we just need to write the profile row.
  async function verifyCode(e) {
    e.preventDefault();
    setMsg(null);
    const token = form.code.trim();
    if (!/^\d{6}$/.test(token)) {
      setMsg({ kind: "err", text: "Code is 6 digits." });
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: form.email.trim(),
        token,
        type: "signup",
      });
      if (error) throw error;
      if (data.user) {
        await supabase
          .from("profiles")
          .upsert({ id: data.user.id, handle: form.handle.trim() });
      }
      setMsg({ kind: "ok", text: "Welcome to the collective, comrade." });
    } catch (err) {
      setMsg({ kind: "err", text: err.message || "Invalid or expired code." });
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setMsg(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: form.email.trim(),
      });
      if (error) throw error;
      setMsg({ kind: "ok", text: "A fresh code is on its way." });
    } catch (err) {
      setMsg({ kind: "err", text: err.message || "Could not resend." });
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

        <div className="avatar-panel">
          <Avatar
            className="avatar-lg"
            url={profile?.avatar_url}
            seed={handle || session.user.email}
            avatarSeed={profile?.avatar_seed}
            alt="your badge"
          />
          <div className="avatar-ctrls">
            <p className="board-note">
              Signed in as <b>{handle || session.user.email}</b>. This is your
              badge — every comrade gets a generated one. Upload your own, or
              re-roll the random soviet/gamer style.
            </p>
            <div className="board-actions">
              <button className="bbs-btn" disabled={avBusy} onClick={() => fileRef.current?.click()}>
                {avBusy ? "…WORKING" : "UPLOAD PIC"}
              </button>
              <button className="bbs-btn alt" disabled={avBusy} onClick={onShuffle}>
                SHUFFLE BADGE
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                style={{ display: "none" }}
              />
            </div>
            {avErr && <div className="board-note err">{avErr}</div>}
          </div>
        </div>

        <p className="board-note">The FORUM (menu F) is open to you. No dues — only solidarity.</p>
        <div className="board-actions">
          <button className="bbs-btn" onClick={signOut}>LOG OUT</button>
          <button className="bbs-btn alt" onClick={onBack}>◄ MENU</button>
        </div>
      </div>
    );
  }

  // Awaiting the email confirmation code after a fresh registration.
  if (awaitingCode) {
    return (
      <div className="board">
        <h1 className="board-title">CONFIRM</h1>
        <p className="board-note">
          A 6-digit code was transmitted to <b>{form.email}</b>. Enter it to
          activate your account, comrade.
        </p>

        <form className="bbs-form" onSubmit={verifyCode}>
          <label>
            <span>CODE</span>
            <input
              value={form.code}
              onChange={set("code")}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              spellCheck="false"
              placeholder="123456"
            />
          </label>

          {msg && <div className={"board-note " + (msg.kind === "err" ? "err" : "ok")}>{msg.text}</div>}

          <div className="board-actions">
            <button className="bbs-btn" type="submit" disabled={busy}>
              {busy ? "…VERIFYING" : "VERIFY"}
            </button>
            <button className="bbs-btn alt" type="button" disabled={busy} onClick={resendCode}>
              RESEND CODE
            </button>
            <button
              className="bbs-btn alt"
              type="button"
              onClick={() => {
                setAwaitingCode(false);
                setMsg(null);
              }}
            >
              ◄ BACK
            </button>
          </div>
        </form>

        <div className="page-foot">— press 0 or ESC to return to the main menu —</div>
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
