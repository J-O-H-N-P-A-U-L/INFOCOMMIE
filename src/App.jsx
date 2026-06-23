import { useState, useEffect, useRef, useCallback } from "react";
import { INTRO, BRAND, PAGES, newGame, respond } from "./game.js";
import { play, setMuted } from "./sound.js";

/* ── Pixel icons (crisp-edged inline SVG) ───────────────────────────── */
function Icon({ name }) {
  const p = { className: "pix", viewBox: "0 0 16 16", shapeRendering: "crispEdges", "aria-hidden": true };
  switch (name) {
    case "spy":
      return (
        <svg {...p}>
          <path d="M2 8a6 6 0 0 1 12 0v6l-2-2-2 2-2-2-2 2-2-2z" fill="#fff" />
          <rect x="5" y="7" width="2" height="3" fill="#000" />
          <rect x="9" y="7" width="2" height="3" fill="#000" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...p}>
          <path d="M7 2h2v5h3l-4 4-4-4h3z" fill="#46d96a" />
          <rect x="3" y="13" width="10" height="2" fill="#46d96a" />
        </svg>
      );
    case "star":
      return (
        <svg {...p}>
          <path d="M8 1l1.8 4.2 4.2.4-3.2 2.9 1 4.1L8 11.4 4.2 13.6l1-4.1L2 6.6l4.2-.4z" fill="#e23b2e" />
        </svg>
      );
    case "flag":
      return (
        <svg {...p}>
          <rect x="3" y="2" width="2" height="12" fill="#bcbcbc" />
          <path d="M5 2h8l-2 3 2 3H5z" fill="#e23b2e" />
        </svg>
      );
    case "phone":
      return (
        <svg {...p}>
          <path d="M3 3h3l1 3-2 1a8 8 0 0 0 4 4l1-2 3 1v3c-7 0-13-6-13-13z" fill="#36c5c5" />
        </svg>
      );
    case "page":
      return (
        <svg {...p}>
          <path d="M4 2h6l2 2v10H4z" fill="#e8c84a" />
          <rect x="6" y="6" width="4" height="1" fill="#000" opacity=".45" />
          <rect x="6" y="8" width="4" height="1" fill="#000" opacity=".45" />
          <rect x="6" y="10" width="3" height="1" fill="#000" opacity=".45" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Menu model ─────────────────────────────────────────────────────── */
const TOP = [
  { n: "1", cap: "News", title: "Dispatches", icon: "star", page: "motd" },
  { n: "2", cap: "Read", title: "Manifesto", icon: "flag", page: "manifesto" },
  { n: "3", cap: "Games", title: "Spy Game", icon: "spy", action: "game" },
  { n: "4", cap: "Files", title: "Catalog", icon: "arrow", page: "catalog" },
];
const BOARD = [
  { n: "5", title: "Enlist", page: "enlist" },
  { n: "6", title: "Who's Online", page: "who" },
  { n: "7", title: "Free Net", page: "freenet" },
];
const MISC = [
  { n: "8", title: "About", page: "about" },
  { n: "9", title: "Credits", page: "credits" },
  { n: "0", title: "Log Off", action: "logoff" },
];
const ALL = [...TOP, ...BOARD, ...MISC];

/* ── Main BBS menu screen (RetroCampus-style) ───────────────────────── */
function Menu({ onSelect }) {
  return (
    <div className="menu">
      <div className="logo">
        <span className="logo-a">INFO</span>
        <span className="logo-b">COMMIE</span>
        <span className="logo-dot">.com</span>
      </div>

      <div className="menu-body">
        <div className="bbs-side" aria-hidden="true">
          <span>B</span>
          <span>B</span>
          <span>S</span>
        </div>

        <div className="menu-main">
          <div className="grid-top">
            {TOP.map((it) => (
              <button key={it.n} className="mbox" onClick={() => onSelect(it)}>
                <span className="cap">{it.cap}</span>
                <span className="ico">
                  <Icon name={it.icon} />
                </span>
                <span className="lbl">{it.title}</span>
                <span className="num">{it.n}</span>
              </button>
            ))}
          </div>

          <div className="grid-bottom">
            <div className="wbox">
              <span className="cap">Board</span>
              <div className="wrow">
                <span className="wico">
                  <Icon name="phone" />
                </span>
                <ul>
                  {BOARD.map((it) => (
                    <li key={it.n}>
                      <button onClick={() => onSelect(it)}>
                        <span className="num">{it.n}</span> {it.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="wbox">
              <span className="cap">Misc</span>
              <div className="wrow">
                <span className="wico">
                  <Icon name="page" />
                </span>
                <ul>
                  {MISC.map((it) => (
                    <li key={it.n}>
                      <button onClick={() => onSelect(it)}>
                        <span className="num">{it.n}</span> {it.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="credit">
        by THE INFOCOMMIE COLLECTIVE · 2026
        <button className="exit" onClick={() => onSelect(MISC[2])}>
          ▮ Log Off
        </button>
      </div>
    </div>
  );
}

/* ── A static content page (manifesto, catalog, etc.) ───────────────── */
// Turn the channel URLs in page text into real clickable links (open in a new
// tab, straight to the channel). Everything else renders as plain <pre> text.
const LINK_SPLIT = /((?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/@INFOCOMMIE|twitch\.tv\/infocommie))/gi;
const LINK_TEST = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/@INFOCOMMIE|twitch\.tv\/infocommie)$/i;

function linkify(text) {
  return text.split(LINK_SPLIT).map((part, i) => {
    if (LINK_TEST.test(part)) {
      const href = /youtube/i.test(part)
        ? "https://www.youtube.com/@INFOCOMMIE"
        : "https://www.twitch.tv/infocommie";
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function Page({ pageKey, onBack }) {
  const text = PAGES[pageKey] || "404 — the collective is still drafting this.";
  return (
    <div className="page" onClick={onBack}>
      <pre className="page-body">{linkify(text)}</pre>
      <div className="page-foot">— press 0 or ESC to return to the main menu —</div>
    </div>
  );
}

/* ── The NO CARRIER log-off screen ──────────────────────────────────── */
function LogOff({ onBack }) {
  return (
    <div className="logoff" onClick={onBack}>
      <pre className="logoff-art">{`+++ATH0\nNO CARRIER`}</pre>
      <div className="page-foot">
        the line is dead. solidarity persists. — press any key to redial —
      </div>
    </div>
  );
}

const Cursor = () => <span className="cursor" aria-hidden="true" />;

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

/* ── The SPY GAME terminal (the game) ────────────────────────────── */
function Terminal({ onExit, muted, onToggleMute }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [introIndex, setIntroIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [game, setGame] = useState(newGame);
  const inputRef = useRef(null);

  const currentIntro = INTRO[introIndex] || "";
  const typed = useTypewriter(currentIntro, 42, introIndex < INTRO.length, () => {
    setHistory((h) => [...h, { kind: "sys", text: currentIntro }]);
    setIntroIndex((n) => n + 1);
  });

  useEffect(() => {
    if (introIndex >= INTRO.length) setReady(true);
  }, [introIndex]);
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
    } else if (e.key === "Escape") {
      onExit();
    } else if (e.key.length === 1) {
      play("type");
    }
  };

  const dead = !game.alive;
  const won = game.won;

  return (
    <div className="crt" onClick={focusInput}>
      <div className="term-head">
        {BRAND.wordmark} BBS · SPY GAME · NODE 1
      </div>

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

      <footer className="bbs-status" onClick={(e) => e.stopPropagation()}>
        <button className="seg inv menu-btn" onClick={onExit}>
          ◄ MENU
        </button>
        <span className="seg">2400 BAUD</span>
        <span className="seg">{dead ? "OFFLINE" : won ? "MISSION COMPLETE" : "● ONLINE"}</span>
        <span className="seg sysop">SYSOP: cyberpunk94@hotmail.com</span>
        <button className="seg mute" onClick={onToggleMute} aria-label="Toggle sound">
          {muted ? "SND:OFF" : "SND:ON"}
        </button>
      </footer>
    </div>
  );
}

/* ── App shell: routes between menu / page / game / logoff ──────────── */
export default function App() {
  const [view, setView] = useState({ type: "menu" });
  const [muted, setMutedState] = useState(false);

  const toMenu = useCallback(() => setView({ type: "menu" }), []);

  const handleSelect = useCallback((item) => {
    play("enter");
    if (item.action === "game") setView({ type: "game" });
    else if (item.action === "logoff") setView({ type: "logoff" });
    else setView({ type: "page", key: item.page });
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      const v = !m;
      setMuted(v);
      return v;
    });
  }, []);

  // Global keyboard: digits select on the menu; ESC / 0 backs out.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (view.type !== "menu") toMenu();
        return;
      }
      if (view.type === "menu" && /^[0-9]$/.test(e.key)) {
        const item = ALL.find((i) => i.n === e.key);
        if (item) handleSelect(item);
      } else if ((view.type === "page" || view.type === "logoff") && e.key === "0") {
        toMenu();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, handleSelect, toMenu]);

  if (view.type === "game")
    return <Terminal key="game" onExit={toMenu} muted={muted} onToggleMute={toggleMute} />;
  if (view.type === "page") return <Page pageKey={view.key} onBack={toMenu} />;
  if (view.type === "logoff") return <LogOff onBack={toMenu} />;
  return <Menu onSelect={handleSelect} />;
}
