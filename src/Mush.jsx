import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, isConfigured } from "./supabase.js";
import { play } from "./sound.js";
import { newGame, respond } from "./game.js";
import { ROOMS, START_ROOM, OPPOSITE, resolveExit, describeRoom } from "./mush.js";

/* ── SPY GAME — a classic BBS M.U.S.H. (Multi-User Shared Hallucination) ──
   The single-player heist still runs as your private thread, but the world is
   now shared: comrades walk the same rooms, see each other, and SAY / POSE in
   real time over Supabase Realtime (presence = who's where, broadcast = talk
   and movement). */

const HELP =
  "ORDERS FROM THE COLLECTIVE:\n" +
  '  Talk   : SAY <text>  (or "<text>) · POSE <action>  (or :<action>)\n' +
  "  Move   : NORTH/SOUTH/EAST/WEST/UP/DOWN (n/s/e/w/u/d), or a room name\n" +
  "  World  : LOOK · WHO · HELP\n" +
  "  Heist  : FEEL · CLAIM SESSION · ROOT · COPY LIST · LEAK · DROP CARRIER · INVENTORY\n" +
  "Movement and talk are free; only the intrusion stirs the trace daemon.";

const rid = (() => { let n = 0; return () => ++n; })();

export default function Mush({ auth, onExit, muted, onToggleMute }) {
  // Identity: your handle if enlisted, else a throwaway guest tag.
  const guestRef = useRef("guest-" + Math.random().toString(36).slice(2, 6));
  const me = auth.handle || guestRef.current;

  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [room, setRoom] = useState(START_ROOM);
  const [presence, setPresence] = useState({}); // handle -> roomId

  const roomRef = useRef(room);
  roomRef.current = room;
  const channelRef = useRef(null);
  const gameRef = useRef(newGame());
  const inputRef = useRef(null);
  const screenRef = useRef(null);

  const push = useCallback((kind, text) => {
    setLines((ls) => [...ls, { id: rid(), kind, text }]);
  }, []);

  const occupantsOf = useCallback(
    (r) => Object.entries(presence).filter(([, rm]) => rm === r).map(([h]) => h),
    [presence]
  );

  // ── Realtime: join the shared "mush" channel, track our room, hear others ──
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase.channel("mush", { config: { presence: { key: me } } });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const map = {};
      for (const metas of Object.values(state)) {
        for (const m of metas) if (m.handle) map[m.handle] = m.room;
      }
      setPresence(map);
    });

    channel.on("broadcast", { event: "say" }, ({ payload }) => {
      if (payload.handle !== me && payload.room === roomRef.current)
        push("peer", `${payload.handle} says, "${payload.text}"`);
    });
    channel.on("broadcast", { event: "pose" }, ({ payload }) => {
      if (payload.handle !== me && payload.room === roomRef.current)
        push("peer", `${payload.handle} ${payload.text}`);
    });
    channel.on("broadcast", { event: "move" }, ({ payload }) => {
      const { handle, from, to, dir } = payload;
      if (handle === me) return;
      if (to === roomRef.current) {
        const where = from == null ? "jacks in" : `arrives from the ${OPPOSITE[dir] || "dark"}`;
        push("arrive", `${handle} ${where}.`);
      } else if (from === roomRef.current) {
        const where = to == null ? "drops carrier" : `heads ${dir}`;
        push("arrive", `${handle} ${where}.`);
      }
    });
    channel.on("broadcast", { event: "beat" }, ({ payload }) => {
      if (payload.handle !== me && payload.room === roomRef.current)
        push("sys", payload.text);
    });

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.track({ handle: me, room: START_ROOM });
      channel.send({ type: "broadcast", event: "move", payload: { handle: me, from: null, to: START_ROOM, dir: null } });
    });

    return () => {
      // Best-effort "X drops carrier" before we disconnect.
      channel.send({ type: "broadcast", event: "move", payload: { handle: me, from: roomRef.current, to: null, dir: null } });
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [me, push]);

  // Opening crawl.
  useEffect(() => {
    push("sys", "CARRIER DETECTED. You jack into the shared hallucination — the");
    push("sys", "STATE SECURITY ARCHIVE, dreamed by every comrade dialed in at once.");
    push("sys", ROOMS[START_ROOM].name + "\n" + ROOMS[START_ROOM].desc);
    push("sys", "Type LOOK to see who's around · HELP for orders · or ◄ MENU to leave.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const bcast = (event, payload) =>
    channelRef.current?.send({ type: "broadcast", event, payload });

  async function moveTo(to, dir) {
    bcast("move", { handle: me, from: roomRef.current, to, dir });
    setRoom(to);
    roomRef.current = to;
    // Re-tracking the same presence key with a new room emits no diff; an
    // untrack + track does, so others' WHO/LOOK see us in the new room.
    const ch = channelRef.current;
    if (ch) {
      await ch.untrack();
      await ch.track({ handle: me, room: to });
    }
    push("sys", describeRoom(to, occupantsOf(to), me));
    play("enter");
  }

  function run(raw) {
    const text = raw.trim();
    if (!text) return;
    push("you", `> ${text}`);
    const lower = text.toLowerCase();
    let m;

    // -- Talk: SAY / "
    if ((m = text.match(/^(?:"|say\s+)(.*)$/i))) {
      const said = m[1].trim();
      if (!said) return push("sys", "Say what, comrade?");
      bcast("say", { handle: me, room: roomRef.current, text: said });
      return push("you", `You say, "${said}"`);
    }
    // -- Pose / emote: : or POSE/EMOTE
    if ((m = text.match(/^(?::|pose\s+|emote\s+)(.*)$/i))) {
      const act = m[1].trim();
      if (!act) return push("sys", "Pose what, comrade?");
      bcast("pose", { handle: me, room: roomRef.current, text: act });
      return push("you", `${me} ${act}`);
    }
    // -- World commands
    if (/^(look|l)$/i.test(lower))
      return push("sys", describeRoom(roomRef.current, occupantsOf(roomRef.current), me));
    if (/^(who|wholist|users)$/i.test(lower)) return push("sys", whoText());
    if (/^(help|\?|commands|orders)$/i.test(lower)) return push("sys", HELP);

    // -- Movement (direction or room name)
    const word = lower.replace(/^(go|move|head|walk|run)\s+/, "").trim();
    const exit = resolveExit(roomRef.current, word);
    if (exit) return moveTo(exit.to, exit.dir);

    // -- Everything else: the private single-player heist engine.
    const res = respond(text, gameRef.current);
    gameRef.current = res.state;
    push(res.sound === "death" ? "death" : res.sound === "win" ? "win" : "sys", res.reply);
    if (res.sound) play(res.sound);
    // Big beats bleed into the shared room so the world feels alive.
    if (res.sound === "win")
      bcast("beat", { handle: me, room: roomRef.current, text: `A surge crosses the wire — ${me} just pulled something off.` });
    if (res.sound === "death")
      bcast("beat", { handle: me, room: roomRef.current, text: `The trace closes on ${me}. A line goes dead in the dark.` });
    if (res.sound === "lamp")
      bcast("beat", { handle: me, room: roomRef.current, text: `The partitions flare with light — ${me} rooted a session nearby.` });
  }

  function whoText() {
    const byRoom = {};
    for (const [h, r] of Object.entries(presence)) (byRoom[r] = byRoom[r] || []).push(h);
    const ids = Object.keys(presence).length;
    const lines = Object.entries(byRoom).map(
      ([r, hs]) => `  ${ROOMS[r]?.name || r}\n    ${hs.join(", ")}`
    );
    return (
      `USERS ONLINE — ${ids} jacked into the hallucination\n` +
      (lines.length ? lines.join("\n") : "  (only you, comrade — for now)") +
      "\n  [trace_daemon] .... [running]  do not page this process"
    );
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run(input);
      setInput("");
    } else if (e.key === "Escape") {
      onExit();
    } else if (e.key.length === 1) {
      play("type");
    }
  };

  const focusInput = () => inputRef.current?.focus();
  const here = occupantsOf(room).filter((h) => h !== me).length;

  return (
    <div className="crt" onClick={focusInput}>
      <div className="term-head">
        INFOCOMMIE BBS · SPY GAME (M.U.S.H.) · {ROOMS[room]?.name || "NODE 1"}
      </div>

      <div className="screen" ref={screenRef}>
        {lines.map((line) => (
          <div
            key={line.id}
            className={
              "line " +
              (line.kind === "you" ? "echo" : line.kind === "peer" ? "peer" :
               line.kind === "arrive" ? "sys arrive" : line.kind === "win" ? "sys win" :
               line.kind === "death" ? "sys death" : "sys")
            }
          >
            {line.text}
          </div>
        ))}

        <div className="prompt-row">
          <span className="caret">&gt;</span>
          <span className="input-text">{input}</span>
          <span className="cursor" aria-hidden="true" />
          <input
            ref={inputRef}
            className="hidden-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            aria-label="Enter a command"
          />
        </div>
      </div>

      <footer className="bbs-status" onClick={(e) => e.stopPropagation()}>
        <button className="seg inv menu-btn" onClick={onExit}>◄ MENU</button>
        <span className="seg">{me}</span>
        <span className="seg">● {here ? `${here} here` : "alone here"}</span>
        <button className="seg mute" onClick={onToggleMute} aria-label="Toggle sound">
          {muted ? "SND:OFF" : "SND:ON"}
        </button>
      </footer>
    </div>
  );
}
