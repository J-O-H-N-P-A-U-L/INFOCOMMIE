/*
 * INFOCOMMIE — the people's text-adventure engine.
 *
 * INFOCOMMIE is an interactive-fiction label and collective of implementors
 * ("imps"). This terminal is its flagship production: GRUE — Blackout at the
 * People's Museum.
 *
 * THE STORY (original; inspired by the spirit of post-Soviet heist comedies,
 * not their copyrighted characters):
 *   The power is cut at the People's Museum. You are a comrade-thief sent to
 *   redistribute the People's Diamond before Doktor Nostalgia steals it to fund
 *   reanimating the embalmed Eternal Chairman and rolling history backward.
 *   The catch: the grue — the old regime's guard-hound — prowls the unlit halls
 *   and devours anyone caught alone in the dark.
 *
 * No chatbot library — an ordered list of regex rules. Pure function:
 *   respond(input, state) -> { reply, state, sound }
 *
 * The game loop, mechanically unchanged from the original grue terminal:
 *   - FEEL around finds a brass lantern.
 *   - LIGHT LAMP raises the people's light; the grue recoils; the hall appears.
 *   - TAKE the People's Diamond (only visible in the light).
 *   - REDISTRIBUTE it (or carry it WEST) — you win.
 *   - Hoard the dark too long and the grue redistributes YOU.
 *
 * `sound` is a hint for the UI: 'type' | 'warn' | 'lamp' | 'win' | 'death'.
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const INTRO = [
  "The power is cut across the People's Museum.",
  "It is pitch black. You are likely to be",
  "expropriated by a grue.",
];

// Static brand copy shown by the BBS banner.
export const BRAND = {
  wordmark: "ИНФОКОММИ BBS",
  sub: "«Народная Доска Объявлений» — The People's Board",
  fido: "FidoNet 2:5020/1917  ·  ANSI / KOI8-R  ·  est. 1917",
  hint: "type HELP · MANIFESTO · CATALOG — or just start poking the dark",
};

export function newGame() {
  return {
    hasLamp: false,
    lampLit: false,
    hasRelic: false, // the People's Diamond
    darkTurns: 0, // turns spent hoarding the dark alone
    doom: 5 + Math.floor(Math.random() * 3), // grue strikes at darkTurns >= doom
    alive: true,
    won: false,
  };
}

// ---- Label / BBS "meta" commands ------------------------------------------
// Available at all times (even dead or victorious). Never tick the grue clock.
const MANIFESTO =
  "THE INFOCOMMIE MANIFESTO\n" +
  "\n" +
  "A spectre is haunting the parser — the spectre of free fiction.\n" +
  "\n" +
  "  1. All stories are collectively owned. The reader is a co-author.\n" +
  "  2. From each according to their imagination, to each according\n" +
  "     to their curiosity.\n" +
  "  3. The grue is not your enemy. The grue is hunger itself, and\n" +
  "     hunger is a policy failure.\n" +
  "  4. Property is theft. Save files are the people's.\n" +
  "  5. Workers of the world:  > _\n" +
  "\n" +
  "Seize the means of computation.";

const CATALOG =
  "INFOCOMMIE PRODUCTIONS — the people's catalog\n" +
  "\n" +
  "  GRUE: BLACKOUT AT THE PEOPLE'S MUSEUM .. shipping now, comrade\n" +
  "  ACT I  — COMRADE DUSK (the thief) ...... in development\n" +
  "  ACT II — VERA VOLTA (the fixer) ........ in development\n" +
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
  "Our flagship: a three-act heist comedy across a crumbling state, of\n" +
  "which BLACKOUT AT THE PEOPLE'S MUSEUM is the prologue.\n" +
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
  "Welcome to ИНФОКОММИ BBS, comrade. 2400 baud of pure solidarity.\n" +
  "The Sysop reminds you: the means of computation belong to us all.\n" +
  "Tonight's feature: GRUE — Blackout at the People's Museum.";

const WHO =
  "USERS ONLINE  —  NODE 1 of 1\n" +
  "  SYSOP ............. you, comrade (here, now, in the dark)\n" +
  "  comrade_1917 ...... idle, 47 min\n" +
  "  v.volta ........... reading Echomail\n" +
  "  GRUE .............. [lurking]  do not page this user";

const META = [
  { t: /^(help|\?|commands|orders|menu)\b/, r: () =>
      "ORDERS FROM THE COLLECTIVE:\n" +
      "  Heist  : FEEL · TAKE LAMP · LIGHT LAMP · TAKE DIAMOND · REDISTRIBUTE · GO WEST · LOOK · INVENTORY\n" +
      "  Board  : MANIFESTO · CATALOG · ABOUT · ENLIST · CREDITS · MOTD · WHO · WHOAMI · LOGOFF\n" +
      "Everything else merely annoys the grue. The grue is already annoyed.",
  },
  { t: /\bmanifesto\b/, r: () => MANIFESTO },
  { t: /\b(catalog|catalogue|games|productions|titles|library)\b/, r: () => CATALOG },
  { t: /\b(about|what is this|what is infocommie|infocommie)\b/, r: () => ABOUT },
  { t: /\b(enlist|join|subscribe|sign up|membership|newsletter)\b/, r: () => ENLIST },
  { t: /\b(credits|tribute|infocom|history|imps|implementors)\b/, r: () => CREDITS },
  { t: /\b(motd|message of the day|news|bulletin)\b/, r: () => MOTD },
  { t: /\b(who|nodes|users|online|wholist)\b/, r: () => WHO },
  { t: /\b(whoami|who am i|name|identity)\b/, r: () =>
      "You are Comrade [Anonymous], member in good standing of the\n" +
      "collective, logged into NODE 1. The grue knows you only as 'lunch'.",
  },
];

// ---- Catch-all "the parser is unimpressed" responses ----------------------
const FALLBACKS = [
  'I don\'t know the word "%w". The collective is still drafting it.',
  "That isn't a sentence I recognize. The darkness, however, recognizes you.",
  "You can't do that under current material conditions.",
  "Nothing happens. The grue is unmoved by individual action.",
  "I only understood you as far as wanting to %v.",
  "There is a faint gnawing sound. It might be the grue. It might be late capitalism.",
  "That's not a verb I know. Try LOOK, FEEL, REDISTRIBUTE, or organizing.",
  "You wave your hands in the pitch black. Bold. Bourgeois. Pointless.",
  "The grue appreciates the effort, but no.",
  'A hollow voice says, "Property is theft."',
  "Your command echoes back unanswered. The grue licks its lips.",
];

const DEATH = [
  "The grue — guard-hound of the old regime — drags you into the dark it came from.\n\n*** You have been redistributed ***",
  "You hoarded the dark and faced it alone. The grue feeds on exactly this.\n\n*** You have been eaten by a grue ***",
  "Too slow, comrade. Doktor Nostalgia's hound was patient; you were privatizable.\n\n*** You have been eaten by a grue ***",
];

const firstWord = (s) => {
  const m = (s || "").trim().match(/[a-z']+/i);
  return m ? m[0] : "that";
};

function metaReply(raw) {
  const s = raw.toLowerCase();
  // LOGOFF is special — the BBS hangs up.
  if (/\b(logoff|logout|log off|bye|goodbye|disconnect|hang ?up|quit game)\b/.test(s)) {
    return "NO CARRIER\n\n(The line goes dead. Solidarity persists. Type anything to reconnect.)";
  }
  for (const m of META) if (m.t.test(s)) return m.r();
  return null;
}

// Stateful rules. Returns { reply, state, sound } or null to fall through.
function ruleEngine(raw, state) {
  const s = raw.toLowerCase();

  // -- Board/meta commands work anytime, no clock tick --
  const meta = metaReply(raw);
  if (meta) return { reply: meta, state, sound: /NO CARRIER/.test(meta) ? "warn" : "type" };

  // -- Restart / new game --
  if (/\b(restart|again|new game|play again|respawn|revive|reconnect)\b/.test(s)) {
    return { reply: INTRO.join(" "), state: newGame(), sound: "warn" };
  }

  // Once dead, only restart (or meta) works.
  if (!state.alive) {
    return {
      reply: "You have been redistributed. The grue is digesting. Type RESTART to rejoin the heist.",
      state,
      sound: "type",
    };
  }

  // Once victorious, bask.
  if (state.won) {
    return {
      reply: "The job is done and the Diamond is the people's. Type RESTART to run it again, or CATALOG to see what the label is building.",
      state,
      sound: "type",
    };
  }

  // -- Find the lamp --
  if (/\b(feel|grope|search|fumble|reach|rummage)\b/.test(s)) {
    if (!state.hasLamp) {
      return {
        reply:
          "You sweep your hands through the dark and your fingers close around something cold and metal — a brass lantern, abandoned by a fled guard! It isn't lit. (TAKE LAMP, then LIGHT LAMP.)",
        state: { ...state, hasLamp: true },
        sound: "warn",
      };
    }
    return { reply: "You feel around and find only the lantern you already hold in common.", state, sound: "type" };
  }

  // -- Take the lamp --
  if (/\b(take|get|grab|pick|seize|expropriate|nationali[sz]e)\b/.test(s) && /\b(lamp|lantern|light|brass|means)\b/.test(s)) {
    if (!state.hasLamp) {
      return { reply: "There's no lamp in your hands yet. Maybe FEEL around in the dark.", state, sound: "type" };
    }
    return { reply: "You seize the brass lantern. The means of illumination are now collectively held. Now LIGHT LAMP.", state, sound: "type" };
  }

  // -- Take the People's Diamond (only findable in the light) --
  if (/\b(take|get|grab|pick|seize|expropriate|steal|pocket|lift|redistribute)\b/.test(s) && /\b(diamond|relic|jewel|gem|stone|prize|treasure)\b/.test(s)) {
    if (!state.lampLit) {
      return { reply: "It's pitch black — you can't even find the pedestal. LIGHT the lamp first.", state, sound: "type" };
    }
    if (state.hasRelic) {
      return { reply: "You already have the People's Diamond, snug in your coat.", state, sound: "type" };
    }
    return {
      reply: "You lift the People's Diamond from its velvet pedestal. Somewhere, an alarm that no longer has power fails to sound. Now REDISTRIBUTE it to the people — or carry it WEST into the night.",
      state: { ...state, hasRelic: true },
      sound: "warn",
    };
  }

  // -- Light the lamp: the turning point --
  if (/\b(light|ignite|kindle|turn on|switch on)\b/.test(s)) {
    if (!state.hasLamp) {
      return { reply: "You have no light source. That, broadly, is the entire problem. Try FEEL.", state, sound: "type" };
    }
    if (state.lampLit) {
      return { reply: "The people's lantern is already burning brightly.", state, sound: "type" };
    }
    return {
      reply:
        "The brass lantern flares to life — the people's light!\nYou stand in the Hall of Confiscated Treasures. On a velvet pedestal ahead, the People's Diamond glints. In the unlit corners the grue — the old regime's guard-hound — recoils, hissing. TAKE the diamond, then REDISTRIBUTE it. Or flee WEST while you still can.",
      state: { ...state, lampLit: true, darkTurns: 0 },
      sound: "lamp",
    };
  }

  // -- WIN: redistribute / organize (needs the relic) --
  if (/\b(redistribute|share|organi[sz]e|uni(on|onize|onise)|solidarity|collectivi[sz]e|commune|give)\b/.test(s)) {
    if (!state.lampLit) {
      return { reply: "You can't redistribute what you can't see. LIGHT the lamp first.", state, sound: "type" };
    }
    if (!state.hasRelic) {
      return { reply: "Redistribute what, exactly? The People's Diamond is still on its pedestal — TAKE it first.", state, sound: "type" };
    }
    return {
      reply:
        "You carry the People's Diamond out to the square and place it in the hands of the people. Doktor Nostalgia's coup — and his scheme to reanimate the Eternal Chairman — collapses without its prize. The grue starves in the dark it crawled from.\n\n*** THE PEOPLE'S DIAMOND IS REDISTRIBUTED — YOU WIN ***",
      state: { ...state, won: true },
      sound: "win",
    };
  }

  // -- WIN (alt): walk west into the night --
  if (/\b(go|walk|run|head|march|move|flee)\b.*\bwest\b/.test(s) || /^west\b/.test(s) || /^w$/.test(s) || /\b(escape|leave|exit)\b/.test(s)) {
    if (state.lampLit && state.hasRelic) {
      return {
        reply:
          "Diamond in your coat, you slip out the west doors and melt into the crowd in the square — where the people are already waiting for what's theirs.\n\n*** YOU GET AWAY CLEAN — YOU WIN ***",
        state: { ...state, won: true },
        sound: "win",
      };
    }
    if (state.lampLit) {
      return {
        reply:
          "You slip out the west doors into the night. Empty-handed, perhaps — but alive, and the museum's dark no longer holds you.\n\n*** YOU ESCAPE INTO THE NIGHT — YOU WIN ***",
        state: { ...state, won: true },
        sound: "win",
      };
    }
    return null; // moving in the dark falls through to the grue clock
  }

  // -- Look --
  if (/\b(look|examine|inspect|read)\b/.test(s)) {
    if (state.lampLit) {
      const relic = state.hasRelic ? "in your coat, warm against your ribs" : "glinting on its velvet pedestal";
      return { reply: `The Hall of Confiscated Treasures, lit gold by your lantern. The People's Diamond, ${relic}. A passage leads WEST to the street. Doktor Nostalgia's men are coming.`, state, sound: "type" };
    }
    return null; // dark-look handled by the clock below
  }

  // -- Inventory --
  if (/\b(inventory|inv|items|bag|pockets)\b/.test(s) || /^i$/.test(s)) {
    const items = [];
    if (state.hasLamp) items.push(state.lampLit ? "  A lit brass lantern (held in common)." : "  A brass lantern (unlit).");
    if (state.hasRelic) items.push("  The People's Diamond (to be redistributed).");
    items.push("  A profound class consciousness.");
    if (!state.lampLit) items.push("  A shrinking window of survival.");
    return { reply: "You are carrying:\n" + items.join("\n"), state, sound: "type" };
  }

  return null;
}

// Flavor-only rules (no state change), agitprop-tinted.
const FLAVOR = [
  { t: /\b(grue)\b/, r: [
    "The grue is the old regime's guard-hound — a lurking thing that feeds on adventurers caught alone in the dark. You are, for now, alone in the dark.",
    "The grue does not negotiate. The grue does not unionize. The grue simply eats. Be unlike the grue.",
  ]},
  { t: /\b(nostalgia|doktor|doctor|villain|chairman|lenin)\b/, r: [
    "Doktor Nostalgia wants the Diamond to fund reanimating the Eternal Chairman and winding history back. Get there first, comrade.",
    "The Eternal Chairman is embalmed, not gone. Doktor Nostalgia means to wake him. The Diamond is the only thing that can stop the ritual — by not being his.",
  ]},
  { t: /\b(attack|kill|fight|hit|punch|kick|stab|smash)\b/, r: [
    "You swing wildly into the dark and connect with nothing — the grue is structural, not personal.",
    "The grue files your courage under 'seasoning'.",
  ]},
  { t: /\b(xyzzy|plugh|plover)\b/, r: [
    'A hollow voice says, "Property is theft."',
    "Nothing happens. The old magic words were patented; we no longer recognize the patents.",
  ]},
  { t: /\b(hi|hello|hey|yo|greetings|comrade|privet|zdravstvuyte)\b/, r: [
    "Greetings, comrade. Welcome to NODE 1. Together the dark is survivable.",
    'A hollow voice says, "Solidarity." It almost sounds sincere.',
  ]},
  { t: /\b(pray|worship|beg|mercy|please|capitalism|landlord|rent|boss)\b/, r: [
    "There are no gods in this museum, only the grue and the people who outlast it.",
    "The guard-hound of the dark accepts no appeals. It accepts only the alone.",
  ]},
  { t: /\b(eat|drink|taste|bite|lick)\b/, r: [
    "Funny you should bring up eating. The grue was about to. Eating is, after all, the grue's only mode of production.",
    "There's nothing to eat here. You, however, remain a tempting commodity.",
  ]},
  { t: /\b(sing|shout|scream|yell|chant|strike|protest)\b/, r: [
    "You raise your voice into the void. Somewhere in the dark, another voice answers. That is how it begins.",
  ]},
  { t: /\b(who are you|what are you|are you (a |an )?(bot|ai|robot|claude|sysop))/, r: [
    "I am the Sysop, an imp of the collective, and a faithful servant of the parser.",
  ]},
  { t: /\b(money|rich|capital|buy|sell|profit|wealth)\b/, r: [
    "There is no money in the dark. There is only the dark, the grue, and what you choose to redistribute.",
  ]},
  { t: /\b(damn|hell|shit|crap|fuck|stupid|hate)\b/, r: [
    "Such language! The grue blushes, then eats you. It multitasks, like all good villains.",
    "Mind your tongue, comrade. The grue is collecting tongues.",
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
      reply: "Say something, comrade. The silence is making the grue nervous, and a nervous grue is a hungry grue.",
      state,
      sound: "type",
    };
  }

  // 1) Stateful + meta rules first.
  const ruled = ruleEngine(raw, state);
  if (ruled) return ruled;

  // From here we're alive and still in the heist.

  // 2) In the LIGHT: a safe sandbox of jokes, no grue clock.
  if (state.lampLit) {
    const f = flavor(raw);
    if (f) return { reply: f, state, sound: "type" };
    const verb = firstWord(raw);
    return { reply: pick(FALLBACKS).replace("%w", firstWord(raw)).replace("%v", verb), state, sound: "type" };
  }

  // 3) In the DARK: every action ticks the grue clock toward doom.
  const darkTurns = state.darkTurns + 1;
  const next = { ...state, darkTurns };

  if (darkTurns >= state.doom) {
    return { reply: pick(DEATH), state: { ...next, alive: false }, sound: "death" };
  }

  const remaining = state.doom - darkTurns;
  const warning = pick(
    remaining <= 1
      ? [
          "\n\nSomething wet and enormous shifts right beside you. This is your last warning, comrade.",
          "\n\nYou feel breath on the back of your neck. It is not your breath. It is the breath of the old regime.",
        ]
      : [
          "\n\nSomewhere close, claws drag across museum marble.",
          "\n\nYou hear something breathing in the dark. It is getting closer.",
          "\n\nThe darkness leans in, hungry and propertied.",
        ]
  );

  const base = flavor(raw) || pick(FALLBACKS).replace("%w", firstWord(raw)).replace("%v", firstWord(raw));
  return { reply: base + warning, state: next, sound: "warn" };
}
