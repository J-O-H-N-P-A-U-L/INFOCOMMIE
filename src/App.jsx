import { useState, useEffect, useRef, useCallback } from "react";
import { PAGES } from "./game.js";
import { play, setMuted } from "./sound.js";
import { useAuth } from "./useAuth.js";
import { usePresence } from "./presence.js";
import Enlist from "./Enlist.jsx";
import Forum from "./Forum.jsx";
import Mush from "./Mush.jsx";
import Showcase from "./Showcase.jsx";
import StatusBar from "./StatusBar.jsx";
import { tipUrl, storeUrl } from "./support.js";

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
    case "play":
      return (
        <svg {...p}>
          <rect x="1" y="3" width="14" height="10" rx="2" fill="#e23b2e" />
          <path d="M7 6l4 2-4 2z" fill="#fff" />
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
  { n: "4", cap: "Watch", title: "Showcase", icon: "play", page: "showcase" },
];
const BOARD = [
  { n: "5", title: "Enlist", action: "enlist" },
  { n: "F", title: "Forum", action: "forum" },
  { n: "6", title: "Who's Online", page: "who" },
  { n: "7", title: "Free Net", page: "freenet" },
];
const MISC = [
  { n: "8", title: "About", page: "about" },
  { n: "9", title: "Credits", page: "credits" },
  { n: "0", title: "Log Off", action: "logoff" },
];
const ALL = [...TOP, ...BOARD, ...MISC];

/* ── Shareable deep links ───────────────────────────────────────────────
   Each view maps to a URL hash (e.g. infocommie.com/#showcase) so links can
   be shared and load straight into that view. Hash routing keeps GitHub Pages
   happy (no server rewrites) and stays clear of Supabase's auth-token hash. */
const VIEW_SLUGS = {
  spygame: { type: "game" },
  enlist: { type: "enlist" },
  forum: { type: "forum" },
  showcase: { type: "page", key: "showcase" },
  who: { type: "page", key: "who" },
  news: { type: "page", key: "motd" },
  manifesto: { type: "page", key: "manifesto" },
  catalog: { type: "page", key: "catalog" },
  freenet: { type: "page", key: "freenet" },
  about: { type: "page", key: "about" },
  credits: { type: "page", key: "credits" },
};

function hashToView(hash) {
  const slug = (hash || "").replace(/^#\/?/, "").toLowerCase();
  return VIEW_SLUGS[slug] || { type: "menu" };
}

function viewToHash(view) {
  if (!view || view.type === "menu") return "";
  for (const [slug, v] of Object.entries(VIEW_SLUGS)) {
    if (v.type === view.type && v.key === view.key) return slug;
  }
  return "";
}

/* ── Main BBS menu screen (RetroCampus-style) ───────────────────────── */
function Menu({ onSelect, handle }) {
  return (
    <div className="menu">
      <div className="logo">
        <span className="logo-a">INFO</span>
        <span className="logo-b">COMMIE</span>
        <span className="logo-cursor" aria-hidden="true" />
      </div>

      {handle && <div className="menu-whoami">● logged in as {handle}</div>}

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
        {tipUrl() && (
          <a className="exit" href={tipUrl()} target="_blank" rel="noopener noreferrer">
            ♥ Support
          </a>
        )}
        {storeUrl() && (
          <a className="exit" href={storeUrl()} target="_blank" rel="noopener noreferrer">
            ▮ Store
          </a>
        )}
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
      <StatusBar onMenu={onBack} hint="◄ MENU · or 0 / ESC to return" />
    </div>
  );
}

/* ── WHO'S ONLINE: live roster of logged-in comrades (Supabase Presence) ─ */
function WhoOnline({ online, me, onBack }) {
  const rows = online.map((u) => {
    const dots = ".".repeat(Math.max(3, 18 - u.handle.length));
    const tag = me && u.handle === me ? "you, comrade (here, now)" : "ACTIVE";
    return `  ${u.handle} ${dots} ${tag}`;
  });
  const body =
    `USERS ONLINE  —  ${online.length} on NODE 1\n` +
    (rows.length
      ? rows.join("\n")
      : "  (the line is quiet — no comrades logged in right now)") +
    "\n  [trace_daemon] .... [running]  do not page this process";
  return (
    <div className="page" onClick={onBack}>
      <pre className="page-body">{linkify(body)}</pre>
      <StatusBar onMenu={onBack} hint="◄ MENU · or 0 / ESC to return" />
    </div>
  );
}

/* ── The NO CARRIER log-off screen ──────────────────────────────────── */
function LogOff({ onBack }) {
  return (
    <div className="logoff" onClick={onBack}>
      <pre className="logoff-art">{`+++ATH0\nNO CARRIER`}</pre>
      <div className="page-foot">
        the line is dead. solidarity persists.
      </div>
      <StatusBar onMenu={onBack} hint="◄ MENU to redial" />
    </div>
  );
}

/* ── App shell: routes between menu / page / game / logoff ──────────── */
export default function App() {
  // Initial view comes from the URL hash, so a shared link loads straight in.
  const [view, setView] = useState(() => hashToView(window.location.hash));
  const [muted, setMutedState] = useState(false);
  const auth = useAuth();
  const online = usePresence(auth.session, auth.handle);

  // Navigate forward into a view, recording a browser-history entry (with the
  // view's hash in the URL) so Back/Forward and our ◄ BACK button traverse
  // views and the address bar always reflects a shareable link.
  const navigate = useCallback((next) => {
    const slug = viewToHash(next);
    const url = slug ? `#${slug}` : window.location.pathname + window.location.search;
    window.history.pushState({ appView: next }, "", url);
    setView(next);
  }, []);

  // One step back = pop a history entry; popstate (below) drives setView. This
  // keeps the browser's history and our React state in sync in both directions.
  const back = useCallback(() => window.history.back(), []);

  // Seed history so Back always reaches the menu — even when landing directly
  // on a deep link — then mirror browser Back/Forward (and manual hash edits)
  // into state.
  useEffect(() => {
    const initial = hashToView(window.location.hash);
    const bare = window.location.pathname + window.location.search;
    window.history.replaceState({ appView: { type: "menu" } }, "", bare);
    if (initial.type !== "menu") {
      window.history.pushState({ appView: initial }, "", `#${viewToHash(initial)}`);
    }
    const onPop = (e) =>
      setView(e.state?.appView || hashToView(window.location.hash));
    const onHash = () => setView(hashToView(window.location.hash));
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const handleSelect = useCallback((item) => {
    play("enter");
    if (item.action === "game") navigate({ type: "game" });
    else if (item.action === "logoff") navigate({ type: "logoff" });
    else if (item.action === "enlist") navigate({ type: "enlist" });
    else if (item.action === "forum") navigate({ type: "forum" });
    else navigate({ type: "page", key: item.page });
  }, [navigate]);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      const v = !m;
      setMuted(v);
      return v;
    });
  }, []);

  // Global keyboard: digits select on the menu; ESC / 0 still back out.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (view.type !== "menu") back();
        return;
      }
      if (view.type === "menu" && e.key.length === 1) {
        const item = ALL.find((i) => i.n === e.key.toUpperCase());
        if (item) handleSelect(item);
      } else if ((view.type === "page" || view.type === "logoff") && e.key === "0") {
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, handleSelect, back]);

  if (view.type === "game")
    return <Mush key="game" auth={auth} onExit={back} muted={muted} onToggleMute={toggleMute} />;
  if (view.type === "enlist") return <Enlist auth={auth} onBack={back} />;
  if (view.type === "forum") return <Forum auth={auth} onBack={back} />;
  if (view.type === "page" && view.key === "who")
    return <WhoOnline online={online} me={auth.handle} onBack={back} />;
  if (view.type === "page" && view.key === "showcase") return <Showcase onBack={back} />;
  if (view.type === "page") return <Page pageKey={view.key} onBack={back} />;
  if (view.type === "logoff") return <LogOff onBack={back} />;
  return <Menu onSelect={handleSelect} handle={auth.handle} />;
}
