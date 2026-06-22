import { useState, useEffect, useRef, useCallback } from "react";
import { INTRO, BRAND, newGame, respond } from "./game.js";
import { play, setMuted } from "./sound.js";

const Cursor = () => <span className="cursor" aria-hidden="true" />;

// Reveals `full` one character at a time; calls onDone when finished.
function useTypewriter(full, speed, active, onDone) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (!active) return;
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(id);
        doneRef.current && doneRef.current();
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, active]);
  return shown;
}

export default function App() {
  const [history, setHistory] = useState([]); // { kind: 'sys'|'echo', text, tone }
  const [input, setInput] = useState("");
  const [introIndex, setIntroIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [game, setGame] = useState(newGame);
  const [muted, setMutedState] = useState(false);
  const inputRef = useRef(null);

  const currentIntro = INTRO[introIndex] || "";
  const typed = useTypewriter(
    currentIntro,
    45,
    introIndex < INTRO.length,
    () => {
      setHistory((h) => [...h, { kind: "sys", text: currentIntro }]);
      setIntroIndex((n) => n + 1);
    }
  );

  useEffect(() => {
    if (introIndex >= INTRO.length) setReady(true);
  }, [introIndex]);

  // Auto-scroll to newest output.
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [history, typed]);

  const focusInput = useCallback(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);
  useEffect(() => {
    if (ready) focusInput();
  }, [ready, focusInput]);

  const submit = useCallback(() => {
    const value = input;
    setInput("");
    const { reply, state, sound } = respond(value, game);
    setGame(state);
    play(sound);
    setHistory((h) => [
      ...h,
      { kind: "echo", text: "> " + value },
      { kind: "sys", text: reply, tone: sound },
    ]);
  }, [input, game]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key.length === 1) {
      play("type");
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = !muted;
    setMuted(v);
    setMutedState(v);
    focusInput();
  };

  const dead = !game.alive;
  const won = game.won;

  const rule = "═".repeat(54);

  return (
    <div className="crt" onClick={focusInput}>
      {/* ── ANSI / FidoNet-style BBS welcome banner ── */}
      <header className="bbs-banner" aria-label="INFOCOMMIE BBS">
        <div className="bbs-line">
          <span className="blk">████</span>{" "}
          <span className="wordmark">{BRAND.wordmark}</span>{" "}
          <span className="blk">████</span>{" "}
          <span className="dim">· NODE 1 · 2400 BAUD</span>
        </div>
        <div className="bbs-rule">{rule}</div>
        <div className="bbs-line cyr">{BRAND.sub}</div>
        <div className="bbs-line dim">{BRAND.fido}</div>
        <div className="bbs-rule">{rule}</div>
        <div className="bbs-line hint">{BRAND.hint}</div>
      </header>

      <div className="screen">
        {history.map((line, i) => (
          <div
            key={i}
            className={
              "line " +
              (line.kind === "echo" ? "echo" : "sys") +
              (line.tone === "death" ? " death" : "") +
              (line.tone === "win" ? " win" : "")
            }
          >
            {line.text}
          </div>
        ))}

        {introIndex < INTRO.length && (
          <div className="line sys">
            {typed}
            <Cursor />
          </div>
        )}

        {ready && (
          <div className={"prompt-row" + (dead ? " dead" : won ? " won" : "")}>
            <span className="caret">&gt;</span>
            <span className="input-text">{input}</span>
            <Cursor />
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
        )}
      </div>

      {/* ── DOS-style bottom status line ── */}
      <footer className="bbs-status" onClick={(e) => e.stopPropagation()}>
        <span className="seg inv">NODE 1</span>
        <span className="seg">2400 BAUD</span>
        <span className="seg">ANSI · KOI8-R</span>
        <span className="seg">{dead ? "OFFLINE" : won ? "MISSION COMPLETE" : "● ONLINE"}</span>
        <span className="seg sysop">SYSOP: comrade@infocommie</span>
        <button className="seg mute" onClick={toggleMute} aria-label="Toggle sound">
          {muted ? "SND:OFF" : "SND:ON"}
        </button>
      </footer>
    </div>
  );
}
