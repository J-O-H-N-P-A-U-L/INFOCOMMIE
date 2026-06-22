/*
 * INFOCOMMIE — the people's text-adventure engine.
 *
 * INFOCOMMIE is an interactive-fiction label and collective of implementors
 * ("imps") reviving the lost art of the text adventure. This terminal is its
 * flagship production: GRUE.
 *
 * No chatbot library — an ordered list of regex rules beats pulling in
 * something like RiveScript: lighter, fully on-theme, trivial to extend. The
 * engine is a pure function: respond(input, state) -> { reply, state, sound }.
 *
 * The game, reskinned in agitprop:
 *   - You start alone in the pitch black. The grue — landlord of the dark —
 *     feeds on the isolated and the hoarding (a "grue clock" ticks toward doom).
 *   - FEEL around finds a brass lantern (property of no one).
 *   - LIGHT LAMP raises the people's light; the grue recoils.
 *   - SHARE / ORGANIZE the light (or GO WEST to the dawn) — you win.
 *   - Hoard the dark too long and the grue redistributes you.
 *
 * `sound` is a hint for the UI: 'type' | 'warn' | 'lamp' | 'win' | 'death'.
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const INTRO = [
  "It is pitch black. You are likely to be",
  "expropriated by a grue.",
];

// Static brand copy shown by the UI banner.
export const BRAND = {
  wordmark: "INFOCOMMIE",
  tagline: "interactive fiction for the collective",
  hint: "type HELP · MANIFESTO · CATALOG — or just start poking the dark",
};

export function newGame() {
  return {
    hasLamp: false,
    lampLit: false,
    darkTurns: 0, // turns spent hoarding the dark alone
    doom: 5 + Math.floor(Math.random() * 3), // grue strikes at darkTurns >= doom
    alive: true,
    won: false,
  };
}

// ---- Label / brand "meta" commands ----------------------------------------
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
  "  GRUE ................................ shipping now, comrade\n" +
  "  THE WINTER PALACE OF ZORK ........... in development\n" +
  "  DIALECTIC OF THE UNDERGROUND EMPIRE . in development\n" +
  "  A MIND FOREVER UNIONIZING ........... pre-production\n" +
  "  PLUNDERED HEARTS, REDISTRIBUTED ..... seeking comrades\n" +
  "\n" +
  "  All titles released into the commons. No DRM. No landlords.";

const ABOUT =
  "INFOCOMMIE is an interactive-fiction label and a collective of\n" +
  "implementors (\"imps\") reviving the lost art of the text adventure —\n" +
  "no graphics, no microtransactions, no masters. Just you, a prompt,\n" +
  "and the dark.\n" +
  "\n" +
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

const META = [
  { t: /^(help|\?|commands|orders)\b/, r: () =>
      "ORDERS FROM THE COLLECTIVE:\n" +
      "  Survival : FEEL · TAKE LAMP · LIGHT LAMP · SHARE · GO WEST · LOOK · INVENTORY\n" +
      "  The label: MANIFESTO · CATALOG · ABOUT · ENLIST · CREDITS · WHOAMI\n" +
      "Everything else merely annoys the grue. The grue is already annoyed.",
  },
  { t: /\bmanifesto\b/, r: () => MANIFESTO },
  { t: /\b(catalog|catalogue|games|productions|titles|library)\b/, r: () => CATALOG },
  { t: /\b(about|what is this|what is infocommie|infocommie)\b/, r: () => ABOUT },
  { t: /\b(enlist|join|subscribe|sign up|membership|newsletter)\b/, r: () => ENLIST },
  { t: /\b(credits|tribute|infocom|history|imps|implementors)\b/, r: () => CREDITS },
  { t: /\b(whoami|who am i|name|identity)\b/, r: () =>
      "You are Comrade [Anonymous], member in good standing of the\n" +
      "collective. The grue knows you only as 'lunch'.",
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
  "That's not a verb I know. Try LOOK, FEEL, SHARE, or organizing.",
  "You wave your hands in the pitch black. Bold. Bourgeois. Pointless.",
  "The grue appreciates the effort, but no.",
  'A hollow voice says, "Property is theft."',
  "Your command echoes back unanswered. The grue licks its lips.",
];

const DEATH = [
  "The grue — landlord of the dark — expropriates you down to the bone.\n\n*** You have been redistributed ***",
  "You hoarded the light and faced the dark alone. The grue feeds on exactly this.\n\n*** You have been eaten by a grue ***",
  "Too slow, comrade. The grue was patient; you were privatizable.\n\n*** You have been eaten by a grue ***",
];

const firstWord = (s) => {
  const m = (s || "").trim().match(/[a-z']+/i);
  return m ? m[0] : "that";
};

function metaReply(raw) {
  const s = raw.toLowerCase();
  for (const m of META) if (m.t.test(s)) return m.r();
  return null;
}

// Stateful rules. Returns { reply, state, sound } or null to fall through.
function ruleEngine(raw, state) {
  const s = raw.toLowerCase();

  // -- Label/meta commands work anytime, dead or alive, no clock tick --
  const meta = metaReply(raw);
  if (meta) return { reply: meta, state, sound: "type" };

  // -- Restart / new game --
  if (/\b(restart|again|new game|play again|respawn|revive)\b/.test(s)) {
    return { reply: INTRO.join(" "), state: newGame(), sound: "warn" };
  }

  // Once dead, only restart (or meta) works.
  if (!state.alive) {
    return {
      reply: "You have been redistributed. The grue is digesting. Type RESTART to rejoin the struggle.",
      state,
      sound: "type",
    };
  }

  // Once victorious, bask.
  if (state.won) {
    return {
      reply: "You stand in the light among comrades, gloriously un-eaten. Type RESTART to brave the dark again, or CATALOG to see what the label is building.",
      state,
      sound: "type",
    };
  }

  // -- Find the lamp --
  if (/\b(feel|grope|search|fumble|reach|rummage)\b/.test(s)) {
    if (!state.hasLamp) {
      return {
        reply:
          "You sweep your hands through the dark and your fingers close around something cold and metal — a brass lantern, property of no one! It isn't lit. (TAKE LAMP, then LIGHT LAMP.)",
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
        "The brass lantern flares to life — the people's light!\nYou stand in a damp stone cave. The darkness recoils, hissing. The grue feeds on the isolated and the hoarding; it cannot abide a light that is shared. SHARE it with the comrades in the dark, or carry it WEST toward the dawn.",
      state: { ...state, lampLit: true, darkTurns: 0 },
      sound: "lamp",
    };
  }

  // -- WIN: share / organize the light --
  if (/\b(share|organi[sz]e|uni(on|onize|onise)|solidarity|redistribute|collectivi[sz]e|commune)\b/.test(s)) {
    if (state.lampLit) {
      return {
        reply:
          "You raise the lantern for every comrade in the dark and pass the light hand to hand. The grue, which feeds on the alone and the hoarding, finds nothing left to eat. It starves in the corner, a relic of an older order.\n\n*** THE COLLECTIVE ENDURES — YOU WIN ***",
        state: { ...state, won: true },
        sound: "win",
      };
    }
    return { reply: "You have no light to share yet. Solidarity is easier with a lantern. Try FEEL, then LIGHT LAMP.", state, sound: "type" };
  }

  // -- WIN (alt): walk west into the dawn --
  if (/\b(go|walk|run|head|march|move)\b.*\bwest\b/.test(s) || /^west\b/.test(s) || /^w$/.test(s) || /\b(escape|leave|exit)\b/.test(s)) {
    if (state.lampLit) {
      return {
        reply:
          "Lantern held high, you march west down the passage and out into the red dawn. The grue does not follow; it cannot stand the light of a new morning.\n\n*** YOU REACH THE DAWN — YOU WIN ***",
        state: { ...state, won: true },
        sound: "win",
      };
    }
    return null; // moving in the dark falls through to the grue clock
  }

  // -- Look --
  if (/\b(look|examine|inspect|read)\b/.test(s)) {
    if (state.lampLit) {
      return { reply: "A damp stone cave, lit gold by the people's lantern. A passage leads WEST toward a red dawn. Comrades stir in the half-dark, waiting for the light to reach them.", state, sound: "type" };
    }
    return null; // dark-look handled by the clock below
  }

  // -- Inventory --
  if (/\b(inventory|inv|items|bag)\b/.test(s) || /^i$/.test(s)) {
    const items = [];
    if (state.hasLamp) items.push(state.lampLit ? "  A lit brass lantern (held in common)." : "  A brass lantern (unlit, property of no one).");
    items.push("  A profound class consciousness.");
    if (!state.lampLit) items.push("  A shrinking window of survival.");
    return { reply: "You are carrying:\n" + items.join("\n"), state, sound: "type" };
  }

  return null;
}

// Flavor-only rules (no state change), agitprop-tinted.
const FLAVOR = [
  { t: /\b(grue)\b/, r: [
    "The grue is a sinister, lurking presence in the dark places of the economy. Its favorite diet is isolated adventurers. You are, for now, an isolated adventurer.",
    "The grue does not negotiate. The grue does not unionize. The grue simply eats. Be unlike the grue.",
  ]},
  { t: /\b(attack|kill|fight|hit|punch|kick|stab|smash)\b/, r: [
    "You swing wildly into the dark and connect with nothing — the grue is structural, not personal.",
    "The grue files your courage under 'seasoning'.",
  ]},
  { t: /\b(xyzzy|plugh|plover)\b/, r: [
    'A hollow voice says, "Property is theft."',
    "Nothing happens. The old magic words were patented; we no longer recognize the patents.",
  ]},
  { t: /\b(hi|hello|hey|yo|greetings|comrade)\b/, r: [
    "Greetings, comrade. Welcome to the dark. Together it is survivable.",
    'A hollow voice says, "Solidarity." It almost sounds sincere.',
  ]},
  { t: /\b(pray|worship|beg|mercy|please|capitalism|landlord|rent|boss)\b/, r: [
    "There are no gods in this cave, only the grue and the people who outlast it.",
    "The landlord of the dark accepts no appeals. It accepts only the alone.",
  ]},
  { t: /\b(eat|drink|taste|bite|lick)\b/, r: [
    "Funny you should bring up eating. The grue was about to. Eating is, after all, the grue's only mode of production.",
    "There's nothing to eat here. You, however, remain a tempting commodity.",
  ]},
  { t: /\b(sing|shout|scream|yell|chant|strike|protest)\b/, r: [
    "You raise your voice into the void. Somewhere in the dark, another voice answers. That is how it begins.",
  ]},
  { t: /\b(who are you|what are you|are you (a |an )?(bot|ai|robot|claude))/, r: [
    "I am the narrator, an imp of the collective, and a faithful servant of the parser.",
  ]},
  { t: /\b(money|rich|capital|buy|sell|profit|wealth)\b/, r: [
    "There is no money in the dark. There is only the dark, the grue, and what you choose to share.",
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

  // From here we're alive and still in the game.

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
          "\n\nYou feel breath on the back of your neck. It is not your breath. It is the breath of capital.",
        ]
      : [
          "\n\nSomewhere close, claws drag across stone.",
          "\n\nYou hear something breathing in the dark. It is getting closer.",
          "\n\nThe darkness leans in, hungry and propertied.",
        ]
  );

  const base = flavor(raw) || pick(FALLBACKS).replace("%w", firstWord(raw)).replace("%v", firstWord(raw));
  return { reply: base + warning, state: next, sound: "warn" };
}
