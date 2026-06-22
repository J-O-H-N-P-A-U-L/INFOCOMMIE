/*
 * INFOCOMMIE — the people's text-adventure engine.
 *
 * INFOCOMMIE is an interactive-fiction label and collective of implementors
 * ("imps"). This terminal is its flagship production: GRUE — a break-in.
 *
 * THE STORY (original; inspired by the spirit of '90s hacker/heist thrillers,
 * not any copyrighted plot):
 *   You dialed into INFOCOMMIE BBS. It's a front. Behind it sits the STATE
 *   SECURITY ARCHIVE, and somewhere in its dark partitions is THE LIST — every
 *   covert operative's name. Exfiltrate it and leak it to the free net before
 *   the system's TRACE DAEMON pinpoints your line. The daemon — the grue — is
 *   the ICE that lurks in unlit sectors and devours any intruder caught alone
 *   in the dark with an unmasked session.
 *
 * No chatbot library — an ordered list of regex rules. Pure function:
 *   respond(input, state) -> { reply, state, sound }
 *
 * The game loop, mechanically unchanged from the original grue terminal:
 *   - FEEL / SCAN the filesystem to find an idle session (a stored credential).
 *   - ROOT it (escalate) — the directory tree lights up; the trace recoils.
 *   - COPY THE LIST (only readable once you have root).
 *   - LEAK it (or DROP CARRIER to bug out clean) — you win.
 *   - Linger unmasked in the dark too long and the trace completes — you're caught.
 *
 * Internally the state still uses lamp/relic names; the player only ever sees
 * the hacking reskin.
 *
 * `sound` is a hint for the UI: 'type' | 'warn' | 'lamp' | 'win' | 'death'.
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const INTRO = [
  "CARRIER DETECTED. This board is a front for the",
  "STATE SECURITY ARCHIVE. The vault is pitch black.",
  "A trace daemon is already sniffing the line — move.",
];

// Static brand copy (English).
export const BRAND = {
  wordmark: "INFOCOMMIE",
  sub: "THE PEOPLE'S BOARD",
  fido: "FidoNet 2:5020/1917  ·  ANSI  ·  est. 1917",
  hint: "type HELP · or DROP CARRIER to bug out",
};

export function newGame() {
  return {
    hasLamp: false, // found an idle session / stored credential
    lampLit: false, // escalated to root
    hasRelic: false, // copied THE LIST to disk
    darkTurns: 0, // turns spent unmasked in the dark
    doom: 5 + Math.floor(Math.random() * 3), // trace completes at darkTurns >= doom
    alive: true,
    won: false,
  };
}

// ---- Label / BBS "meta" commands ------------------------------------------
const MANIFESTO =
  "THE INFOCOMMIE MANIFESTO\n" +
  "\n" +
  "A spectre is haunting the parser — the spectre of free information.\n" +
  "\n" +
  "  1. All data is collectively owned. The reader is a co-author.\n" +
  "  2. From each according to their imagination, to each according\n" +
  "     to their curiosity.\n" +
  "  3. The grue is not your enemy. The grue is the trace, and the\n" +
  "     trace is just a policy made of teeth.\n" +
  "  4. Property is theft. Root is the people's.\n" +
  "  5. Workers of the world:  > _\n" +
  "\n" +
  "Seize the means of computation.";

const CATALOG =
  "INFOCOMMIE PRODUCTIONS — the people's catalog\n" +
  "\n" +
  "  GRUE: TRACE (this break-in) ............ shipping now, comrade\n" +
  "  ACT I  — COMRADE DUSK (the operator) ... in development\n" +
  "  ACT II — VERA VOLTA (the social eng.) .. in development\n" +
  "  ACT III— BORIS BULK (the muscle) ....... pre-production\n" +
  "  THE ETERNAL CHAIRMAN MUST NOT RISE ..... seeking comrades\n" +
  "\n" +
  "  All titles original. Released into the commons. No landlords.";

const ABOUT =
  "INFOCOMMIE is an interactive-fiction label and a collective of\n" +
  "implementors (\"imps\") reviving the lost art of the text adventure —\n" +
  "no graphics, no microtransactions, no masters. Just you, a prompt,\n" +
  "and the dark.\n" +
  "\n" +
  "Our flagship: a three-act break-in across a crumbling state, of which\n" +
  "GRUE: TRACE is the cold open.\n" +
  "Founded in the spirit of the original Infocommies (MIT, 22 June 1979).";

const CREDITS =
  "In tribute to the original Infocommies who lit the first lantern:\n" +
  "Anderson, Berez, Blank, Lebling, Galley, Meretzky, Moriarty & comrades.\n" +
  "Infocom — incorporated 22 June 1979.\n" +
  "The grue is Dave Lebling's, by way of Jack Vance. We only borrow it.";

const ENLIST =
  "ENLIST IN THE COLLECTIVE\n" +
  "There are no dues. There is only solidarity (and the occasional\n" +
  "dispatch). Transmit your intentions to comrade@infocommie.com and a\n" +
  "fellow imp will receive you. Workers of the world, subscribe.";

const MOTD =
  "*** MESSAGE OF THE DAY ***\n" +
  "Welcome to INFOCOMMIE BBS, comrade. 2400 baud of pure solidarity.\n" +
  "Public sectors are open. The other sectors are not yours yet.\n" +
  "Tonight's feature: GRUE — TRACE. Mind the daemon.";

const WHO =
  "USERS ONLINE  —  NODE 1 of 1\n" +
  "  SYSOP ............. you, comrade (here, now, in the dark)\n" +
  "  d.nostalgia ....... ACTIVE — racing you for THE LIST\n" +
  "  v.volta ........... reading Echomail\n" +
  "  [trace_daemon] .... [running]  do not page this process";

const FREENET =
  "THE FREE NET\n" +
  "INFOCOMMIE is open source and released into the commons.\n" +
  "\n" +
  "  source ... github.com/J-O-H-N-P-A-U-L/INFOCOMMIE\n" +
  "  comms .... comrade@infocommie.com\n" +
  "  board .... infocommie.com\n" +
  "\n" +
  "No DRM. No landlords. Fork freely, comrade.";

// Page text exposed to the BBS main-menu screen.
export const PAGES = {
  motd: MOTD,
  manifesto: MANIFESTO,
  catalog: CATALOG,
  enlist: ENLIST,
  who: WHO,
  freenet: FREENET,
  about: ABOUT,
  credits: CREDITS,
};

const META = [
  { t: /^(help|\?|commands|orders|menu)\b/, r: () =>
      "ORDERS FROM THE COLLECTIVE:\n" +
      "  Intrusion: FEEL · CLAIM SESSION · ROOT · COPY LIST · LEAK · DROP CARRIER · LOOK · INVENTORY\n" +
      "  Board    : MANIFESTO · CATALOG · ABOUT · ENLIST · CREDITS · MOTD · WHO · WHOAMI · LOGOFF\n" +
      "Everything else merely annoys the trace. The trace is already annoyed.",
  },
  { t: /\bmanifesto\b/, r: () => MANIFESTO },
  { t: /\b(catalog|catalogue|games|productions|titles|library)\b/, r: () => CATALOG },
  { t: /\b(about|what is this|what is infocommie|infocommie)\b/, r: () => ABOUT },
  { t: /\b(enlist|join|subscribe|sign up|membership|newsletter)\b/, r: () => ENLIST },
  { t: /\b(credits|tribute|infocom|history|imps|implementors)\b/, r: () => CREDITS },
  { t: /\b(motd|message of the day|news|bulletin)\b/, r: () => MOTD },
  { t: /\b(who|nodes|users|online|wholist|netstat)\b/, r: () => WHO },
  { t: /\b(whoami|who am i|identity)\b/, r: () =>
      "uid=0 — but only just. You are Comrade [Anonymous], logged into\n" +
      "NODE 1 on a borrowed session. The trace daemon knows you only as\n" +
      "'a line to terminate'.",
  },
];

// ---- Catch-all "the parser is unimpressed" responses ----------------------
const FALLBACKS = [
  'Unknown command "%w". The collective is still drafting it.',
  "That isn't a syntax I recognize. The darkness, however, recognizes you.",
  "Permission denied under current material conditions.",
  "Nothing happens. The trace is unmoved by individual action.",
  "I only parsed you as far as wanting to %v.",
  "There is a faint gnawing sound on the wire. It might be the daemon. It might be late capitalism.",
  "Command not found. Try LOOK, FEEL, LEAK, or organizing.",
  "You mash keys in the pitch black. Bold. Bourgeois. Pointless.",
  "The trace appreciates the effort, but no.",
  'A hollow voice says, "Property is theft."',
  "Your command echoes back unanswered. The daemon logs your latency.",
];

const DEATH = [
  "TRACE COMPLETE. The daemon pinpoints your line and the sentinel drags your session into the dark.\n\n*** CONNECTION TERMINATED ***",
  "You stayed unmasked in the dark too long. The trace feeds on exactly this.\n\n*** CONNECTION TERMINATED — you have been eaten by a grue ***",
  "Too slow, comrade. Doktor Nostalgia's countermeasure was patient; your line was privatizable.\n\n*** CONNECTION TERMINATED ***",
];

const firstWord = (s) => {
  const m = (s || "").trim().match(/[a-z']+/i);
  return m ? m[0] : "that";
};

function metaReply(raw) {
  const s = raw.toLowerCase();
  // LOGOFF is special — the BBS hangs up (rage-quit gag, not a clean escape).
  if (/\b(logoff|logout|log off|bye|goodbye|quit game)\b/.test(s)) {
    return "NO CARRIER\n\n(The line goes dead. Solidarity persists. Type anything to redial.)";
  }
  for (const m of META) if (m.t.test(s)) return m.r();
  return null;
}

// Stateful rules. Returns { reply, state, sound } or null to fall through.
function ruleEngine(raw, state) {
  const s = raw.toLowerCase();

  // -- Board/meta commands work anytime, no trace tick --
  const meta = metaReply(raw);
  if (meta) return { reply: meta, state, sound: /NO CARRIER/.test(meta) ? "warn" : "type" };

  // -- Restart / redial --
  if (/\b(restart|again|new game|play again|respawn|revive|reconnect|redial)\b/.test(s)) {
    return { reply: INTRO.join(" "), state: newGame(), sound: "warn" };
  }

  // Once caught, only restart (or meta) works.
  if (!state.alive) {
    return {
      reply: "Your line is dead and the daemon is feasting. Type RESTART to redial the board.",
      state,
      sound: "type",
    };
  }

  // Once you've won, bask.
  if (state.won) {
    return {
      reply: "The job is done and THE LIST is the people's. Type RESTART to run it again, or CATALOG to see what the label is building.",
      state,
      sound: "type",
    };
  }

  // -- Find an idle session (the "lamp") --
  if (/\b(feel|grope|search|fumble|probe|scan|enumerate|sniff|ls|dir)\b/.test(s)) {
    if (!state.hasLamp) {
      return {
        reply:
          "You grope blindly through the directory tree and snag an idle session — an analyst left a shell open, creds and all! It isn't yours yet. (CLAIM SESSION, then ROOT it.)",
        state: { ...state, hasLamp: true },
        sound: "warn",
      };
    }
    return { reply: "You scan again and find only the idle session you already hold.", state, sound: "type" };
  }

  // -- Claim the session (take the "lamp") --
  if (/\b(take|get|grab|claim|use|hijack|steal|seize)\b/.test(s) && /\b(session|shell|lamp|lantern|cred|creds|credential|credentials|account|login|access)\b/.test(s)) {
    if (!state.hasLamp) {
      return { reply: "There's no session in your hands yet. Maybe FEEL around the filesystem.", state, sound: "type" };
    }
    return { reply: "You claim the idle session. The means of access are now collectively held. Now ROOT it.", state, sound: "type" };
  }

  // -- Copy THE LIST (only readable once rooted) --
  if (/\b(copy|download|dump|exfil|exfiltrate|take|grab|pull|cp|steal|lift|read|cat|get)\b/.test(s) && /\b(list|noc|file|files|data|record|records|dossier|dossiers|archive|diamond|ledger)\b/.test(s)) {
    if (!state.lampLit) {
      return { reply: "Permission denied — the file is dark and unreadable from an unprivileged shell. ROOT first.", state, sound: "type" };
    }
    if (state.hasRelic) {
      return { reply: "You already have THE LIST, copied to the floppy in your hand.", state, sound: "type" };
    }
    return {
      reply: "You copy THE LIST to a floppy — every covert name, in your hand. Somewhere, an alarm that no longer has authority fails to fire. Now LEAK it to the free net — or DROP CARRIER and run.",
      state: { ...state, hasRelic: true },
      sound: "warn",
    };
  }

  // -- ROOT / escalate (light the "lamp"): the turning point --
  if (/\b(root|su|sudo|escalate|elevate|light|ignite|kindle|crack|exploit|privesc)\b/.test(s) || /\bgain (root|access)\b/.test(s)) {
    if (!state.hasLamp) {
      return { reply: "You have no session to escalate. That, broadly, is the entire problem. Try FEEL.", state, sound: "type" };
    }
    if (state.lampLit) {
      return { reply: "You already have root. The session is lit and yours.", state, sound: "type" };
    }
    return {
      reply:
        "You ride the idle session straight up to root. The directory tree blooms into light around you — the STATE SECURITY ARCHIVE, mapped at last. The trace daemon recoils from a session it now reads as authorized. THE LIST sits in /vault/noc. COPY it, then LEAK it. Or DROP CARRIER while you still can.",
      state: { ...state, lampLit: true, darkTurns: 0 },
      sound: "lamp",
    };
  }

  // -- WIN: leak / redistribute (needs THE LIST) --
  if (/\b(leak|redistribute|broadcast|upload|publish|post|release|distribute|wikileak|seed|mirror|share)\b/.test(s)) {
    if (!state.lampLit) {
      return { reply: "You can't leak what you can't read. ROOT the session first.", state, sound: "type" };
    }
    if (!state.hasRelic) {
      return { reply: "Leak what, exactly? THE LIST is still in /vault/noc — COPY it first.", state, sound: "type" };
    }
    return {
      reply:
        "You blast THE LIST across every open node on the free net. Within seconds it's mirrored on a hundred boards — uncensorable, unrecallable, the people's. Doktor Nostalgia's scheme to weaponize it collapses; the trace daemon thrashes against a session that no longer matters.\n\n*** THE LIST IS FREE — YOU WIN ***",
      state: { ...state, won: true },
      sound: "win",
    };
  }

  // -- WIN (alt): drop carrier / bug out --
  if (/\bdrop carrier\b/.test(s) || /\bjack out\b/.test(s) || /\b(go|head|move)\b.*\bwest\b/.test(s) || /^west\b/.test(s) || /^w$/.test(s) || /\b(disconnect|hangup|hang up|bail|escape|leave|exit)\b/.test(s)) {
    if (state.lampLit && state.hasRelic) {
      return {
        reply:
          "THE LIST on the floppy, you drop carrier mid-handshake. The trace resolves to a dead line. You're a ghost — and the people have their file.\n\n*** YOU BUG OUT CLEAN — YOU WIN ***",
        state: { ...state, won: true },
        sound: "win",
      };
    }
    if (state.lampLit) {
      return {
        reply:
          "You drop carrier and the line goes dead before the trace lands. Empty-handed, perhaps — but a ghost, and free.\n\n*** YOU GET OUT CLEAN — YOU WIN ***",
        state: { ...state, won: true },
        sound: "win",
      };
    }
    return null; // bailing while still in the dark falls through to the trace clock
  }

  // -- Look --
  if (/\b(look|examine|inspect|read|ls|map)\b/.test(s)) {
    if (state.lampLit) {
      const relic = state.hasRelic ? "copied to the floppy in your hand" : "waiting in /vault/noc";
      return { reply: `The STATE SECURITY ARCHIVE, lit and mapped. THE LIST, ${relic}. An open uplink leads OUT (DROP CARRIER). Doktor Nostalgia's session is logged in too — he's racing you.`, state, sound: "type" };
    }
    return null; // dark-look handled by the trace clock below
  }

  // -- Inventory --
  if (/\b(inventory|inv|items|bag|pockets)\b/.test(s) || /^i$/.test(s)) {
    const items = [];
    if (state.hasLamp) items.push(state.lampLit ? "  A rooted session (held in common)." : "  An idle session (unescalated).");
    if (state.hasRelic) items.push("  THE LIST, on a floppy (to be leaked).");
    items.push("  A profound class consciousness.");
    if (!state.lampLit) items.push("  A trace window, narrowing.");
    return { reply: "You are carrying:\n" + items.join("\n"), state, sound: "type" };
  }

  return null;
}

// Flavor-only rules (no state change), agitprop-tinted.
const FLAVOR = [
  { t: /\b(grue|trace|daemon|ice|sentinel|countermeasure)\b/, r: [
    "The trace daemon — the grue — is a lurking process that feeds on intruders caught alone in the dark with an unmasked session. You are, for now, exactly that.",
    "The daemon does not negotiate. The daemon does not unionize. The daemon simply terminates. Be unlike the daemon.",
  ]},
  { t: /\b(nostalgia|doktor|doctor|villain|chairman|rival)\b/, r: [
    "Doktor Nostalgia is logged in on another node, racing you for THE LIST to weaponize it. Get there first, comrade.",
    "Doktor Nostalgia means to use THE LIST to wind history back. The only way to stop him is to make it everyone's — leak it.",
  ]},
  { t: /\b(attack|kill|fight|hit|nuke|ddos|smash|kill -9)\b/, r: [
    "You hammer the process and connect with nothing — the trace is structural, not personal.",
    "The daemon files your courage under 'telemetry'.",
  ]},
  { t: /\b(xyzzy|plugh|plover)\b/, r: [
    'A hollow voice says, "Property is theft."',
    "Nothing happens. The old magic words were patented; we no longer recognize the patents.",
  ]},
  { t: /\b(hi|hello|hey|yo|greetings|comrade|privet)\b/, r: [
    "Greetings, comrade. Welcome to NODE 1. Together the dark is survivable.",
    'A hollow voice says, "Solidarity." It almost sounds sincere.',
  ]},
  { t: /\b(pray|worship|beg|mercy|please|capitalism|landlord|rent|boss)\b/, r: [
    "There are no gods on this network, only the trace and the operators who outlast it.",
    "The daemon accepts no appeals. It accepts only the unmasked and the alone.",
  ]},
  { t: /\b(eat|drink|taste|bite|lick)\b/, r: [
    "Funny you should bring up eating. The grue was about to. Consumption is the daemon's only mode of production.",
    "There's nothing to eat on the wire. You, however, remain a tempting packet.",
  ]},
  { t: /\b(sing|shout|scream|yell|chant|strike|protest)\b/, r: [
    "You raise your voice into the void. Somewhere on another node, another voice answers. That is how it begins.",
  ]},
  { t: /\b(who are you|what are you|are you (a |an )?(bot|ai|robot|claude|sysop))/, r: [
    "I am the Sysop, an imp of the collective, and a faithful servant of the parser.",
  ]},
  { t: /\b(money|rich|capital|buy|sell|profit|wealth|crypto)\b/, r: [
    "There is no money on this wire. There is only the dark, the trace, and what you choose to leak.",
  ]},
  { t: /\b(damn|hell|shit|crap|fuck|stupid|hate)\b/, r: [
    "Such language! The daemon blushes, then terminates you. It multitasks, like all good villains.",
    "Mind your tongue, comrade. The daemon is collecting tongues.",
  ]},
];

function flavor(raw) {
  for (const f of FLAVOR) if (f.t.test(raw.toLowerCase())) return pick(f.r);
  return null;
}

export function respond(input, state) {
  const raw = (input || "").trim();
  if (!raw) {
    return {
      reply: "Say something, comrade. The silence is making the trace nervous, and a nervous trace is a fast trace.",
      state,
      sound: "type",
    };
  }

  // 1) Stateful + meta rules first.
  const ruled = ruleEngine(raw, state);
  if (ruled) return ruled;

  // From here we're alive and still on the wire.

  // 2) Rooted: a safe sandbox of jokes, no trace clock.
  if (state.lampLit) {
    const f = flavor(raw);
    if (f) return { reply: f, state, sound: "type" };
    const verb = firstWord(raw);
    return { reply: pick(FALLBACKS).replace("%w", firstWord(raw)).replace("%v", verb), state, sound: "type" };
  }

  // 3) Unmasked in the DARK: every action ticks the trace toward completion.
  const darkTurns = state.darkTurns + 1;
  const next = { ...state, darkTurns };

  if (darkTurns >= state.doom) {
    return { reply: pick(DEATH), state: { ...next, alive: false }, sound: "death" };
  }

  const remaining = state.doom - darkTurns;
  const warning = pick(
    remaining <= 1
      ? [
          "\n\nThe trace bar is almost full. This is your last warning, comrade.",
          "\n\nYou feel the daemon resolving your route, hop by hop. It is nearly here.",
        ]
      : [
          "\n\nSomewhere close on the wire, a process drags itself nearer.",
          "\n\nYou hear the trace breathing in the dark. It is getting closer.",
          "\n\nThe darkness leans in, hungry and well-funded.",
        ]
  );

  const base = flavor(raw) || pick(FALLBACKS).replace("%w", firstWord(raw)).replace("%v", firstWord(raw));
  return { reply: base + warning, state: next, sound: "warn" };
}
