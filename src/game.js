/*
 * GRUE — a tiny Zork-flavored text-adventure engine.
 *
 * No chatbot library: an ordered list of regex rules beats pulling in something
 * like RiveScript here — lighter, fully on-theme, and trivial to extend. The
 * engine is a pure function: respond(input, state) -> { reply, state, sound }.
 *
 * There is a real (tiny) game underneath the jokes:
 *   - You start in the pitch black with a grue closing in (a "grue clock").
 *   - FEEL / SEARCH around finds a brass lantern.
 *   - LIGHT LAMP banishes the grue and reveals the way out.
 *   - GO WEST (in the light) escapes — you win.
 *   - Linger in the dark too long and the grue eats you.
 *
 * `sound` is a hint for the UI: 'type' | 'warn' | 'lamp' | 'win' | 'death'.
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const INTRO = [
  "It is pitch black.",
  "You are likely to be eaten",
  "by a grue.",
];

export function newGame() {
  return {
    hasLamp: false,
    lampLit: false,
    darkTurns: 0, // turns spent fumbling in the dark
    doom: 5 + Math.floor(Math.random() * 3), // grue strikes at darkTurns >= doom
    alive: true,
    won: false,
  };
}

// ---- Catch-all "the parser is unimpressed" responses ----------------------
const FALLBACKS = [
  'I don\'t know the word "%w".',
  "That isn't a sentence I recognize. The darkness, however, recognizes you.",
  "You can't do that here. Or anywhere. Possibly ever.",
  "Nothing happens. The grue is unmoved.",
  "I only understood you as far as wanting to %v.",
  "There is a faint gnawing sound. It might be the grue. It might be regret.",
  "That's not a verb I know. Try LOOK, GO, TAKE, FEEL, or screaming.",
  "You wave your hands in the pitch black. Very brave. Very pointless.",
  "The grue appreciates the effort, but no.",
  'A hollow voice says, "Fool."',
  "Your command echoes back unanswered. The grue licks its lips.",
];

const DEATH = [
  "There is a rustle in the dark. Two yellow eyes. A wet, terrible crunch.\n\n*** You have been eaten by a grue ***",
  "The grue strikes from the black. You feel cold teeth, then nothing at all.\n\n*** You have died ***",
  "Too slow. The grue was patient; you were snackable.\n\n*** You have been eaten by a grue ***",
];

const firstWord = (s) => {
  const m = (s || "").trim().match(/[a-z']+/i);
  return m ? m[0] : "that";
};

// Rules that need game state live here as functions of (input, state).
// Returns { reply, state, sound } or null to fall through.
function ruleEngine(raw, state) {
  const s = raw.toLowerCase();

  // -- Restart from the grave / new game --
  if (/\b(restart|again|new game|play again|respawn|revive)\b/.test(s)) {
    return {
      reply: INTRO.join(" "),
      state: newGame(),
      sound: "warn",
    };
  }

  // Once dead, only restart works.
  if (!state.alive) {
    return {
      reply:
        "You are dead. The grue is digesting. Type RESTART to try the dark again.",
      state,
      sound: "type",
    };
  }

  // Once won, bask.
  if (state.won) {
    return {
      reply:
        "You stand in the sunlight, lantern in hand, gloriously un-eaten. Type RESTART to tempt the dark once more.",
      state,
      sound: "type",
    };
  }

  // -- Help --
  if (/^(help|\?|commands|how do i play)\b/.test(s)) {
    return {
      reply:
        "Verbs that matter: FEEL (around), TAKE LAMP, LIGHT LAMP, GO WEST, LOOK, INVENTORY.\n" +
        "Everything else mostly annoys the grue. The grue is already annoyed.",
      state,
      sound: "type",
    };
  }

  // -- Find the lamp --
  if (/\b(feel|grope|search|fumble|reach|grub|rummage)\b/.test(s)) {
    if (!state.hasLamp) {
      return {
        reply:
          "You sweep your hands through the dark and your fingers close around something cold and metal — a brass lantern! It isn't lit. (TAKE LAMP, then LIGHT LAMP.)",
        state: { ...state, hasLamp: true },
        sound: "warn",
      };
    }
    return {
      reply: "You feel around and find only the lantern you already have.",
      state,
      sound: "type",
    };
  }

  // -- Take the lamp --
  if (/\b(take|get|grab|pick)\b/.test(s) && /\b(lamp|lantern|light|brass)\b/.test(s)) {
    if (!state.hasLamp) {
      return {
        reply: "There's no lamp in your hand yet. Maybe FEEL around in the dark.",
        state,
        sound: "type",
      };
    }
    return { reply: "You grip the brass lantern tightly. Now LIGHT LAMP.", state, sound: "type" };
  }

  // -- Light the lamp: the turning point --
  if (/\b(light|ignite|turn on|switch on)\b/.test(s) || /\blight lamp\b/.test(s)) {
    if (!state.hasLamp) {
      return {
        reply:
          "You have no light source. That, broadly, is the entire problem. Try FEEL.",
        state,
        sound: "type",
      };
    }
    if (state.lampLit) {
      return { reply: "The lantern is already burning brightly.", state, sound: "type" };
    }
    return {
      reply:
        "The lantern flares to life!\nYou are in a damp stone cave. A low passage leads WEST toward a sliver of daylight. From the corner of your eye, a grue recoils from the glow and slinks back into the dark, hissing its disappointment.",
      state: { ...state, lampLit: true, darkTurns: 0 },
      sound: "lamp",
    };
  }

  // -- Go west (escape) — only safe/possible in the light --
  if (/\b(go|walk|run|head|move)\b.*\bwest\b/.test(s) || /^west\b/.test(s) || /^w$/.test(s) || /\b(leave|exit|escape)\b/.test(s)) {
    if (state.lampLit) {
      return {
        reply:
          "Lantern held high, you stride west down the passage and out into blessed daylight. The grue does not follow.\n\n*** You have escaped the grue — YOU WIN ***",
        state: { ...state, won: true },
        sound: "win",
      };
    }
    // moving in the dark is how you die
    return null; // fall to the dark-movement handler below
  }

  // -- Look --
  if (/\b(look|examine|inspect|read)\b/.test(s)) {
    if (state.lampLit) {
      return {
        reply:
          "A damp stone cave, lit gold by your lantern. A passage leads WEST to daylight. No grue in sight — for now.",
        state,
        sound: "type",
      };
    }
    return null; // dark-look handled by witty pile + clock below
  }

  // -- Inventory --
  if (/\b(inventory|inv|items|bag)\b/.test(s) || /^i$/.test(s)) {
    const items = [];
    if (state.hasLamp) items.push(state.lampLit ? "  A lit brass lantern." : "  A brass lantern (unlit).");
    items.push("  A profound sense of dread.");
    if (!state.lampLit) items.push("  A shrinking window of survival.");
    return { reply: "You are carrying:\n" + items.join("\n"), state, sound: "type" };
  }

  return null;
}

// Witty, flavor-only rules (no state change). Used when light is on OR before
// the dark-clock fallback fires.
const FLAVOR = [
  { t: /\b(grue)\b/, r: [
    "The grue is a sinister, lurking presence in the dark places of the earth. Its favorite diet is adventurers. You are an adventurer.",
    "Mentioning the grue does not improve your relationship with the grue.",
  ]},
  { t: /\b(attack|kill|fight|hit|punch|kick|stab)\b/, r: [
    "You swing wildly and connect with nothing helpful.",
    "The grue files your courage under 'seasoning'.",
  ]},
  { t: /\b(xyzzy|plugh|plover)\b/, r: [
    'A hollow voice says, "Fool."',
    "Nothing happens. (But you feel briefly seen by the magic.)",
  ]},
  { t: /\b(hi|hello|hey|yo|greetings)\b/, r: [
    "Hello! Welcome to the dark. Your stay may be brief.",
    'A hollow voice says, "Hello." It is not being friendly.',
  ]},
  { t: /\b(pray|worship|beg|mercy|please)\b/, r: [
    "If there is a god of small dark caves, it is the grue, and it is hungry.",
  ]},
  { t: /\b(eat|drink|taste|bite|lick)\b/, r: [
    "Funny you should bring up eating. The grue was about to.",
    "There's nothing to eat here. You, however, are very much on the menu.",
  ]},
  { t: /\b(sing|shout|scream|yell|whistle)\b/, r: [
    "You scream into the void. The void was already full. It's mostly grue.",
  ]},
  { t: /\b(who are you|what are you|are you (a |an )?(bot|ai|robot|claude))/, r: [
    "I am the narrator of your brief, dark, and grue-adjacent existence.",
  ]},
  { t: /\b(damn|hell|shit|crap|fuck|stupid|hate)\b/, r: [
    "Such language! The grue blushes, then eats you. It multitasks.",
    "Mind your tongue. The grue is collecting tongues.",
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
      reply:
        "Say something. The silence is making the grue nervous, and you really don't want a nervous grue.",
      state,
      sound: "type",
    };
  }

  // 1) Stateful rules first (lamp, light, escape, death-gating, etc.)
  const ruled = ruleEngine(raw, state);
  if (ruled) return ruled;

  // If we're dead/won, ruleEngine already returned; from here we're alive & playing.

  // 2) In the LIGHT: it's a safe sandbox of jokes, no grue clock.
  if (state.lampLit) {
    const f = flavor(raw);
    if (f) return { reply: f, state, sound: "type" };
    const verb = firstWord(raw);
    return {
      reply: pick(FALLBACKS).replace("%w", firstWord(raw)).replace("%v", verb),
      state,
      sound: "type",
    };
  }

  // 3) In the DARK: every action ticks the grue clock toward doom.
  const darkTurns = state.darkTurns + 1;
  const next = { ...state, darkTurns };

  if (darkTurns >= state.doom) {
    return {
      reply: pick(DEATH),
      state: { ...next, alive: false },
      sound: "death",
    };
  }

  // A flavor reply still lands, but now with a creeping warning attached.
  const remaining = state.doom - darkTurns;
  const warning = pick(
    remaining <= 1
      ? [
          "\n\nSomething wet and enormous shifts right beside you. This is your last warning.",
          "\n\nYou feel breath on the back of your neck. It is not your breath.",
        ]
      : [
          "\n\nSomewhere close, claws drag across stone.",
          "\n\nYou hear something breathing in the dark. It is getting closer.",
          "\n\nThe darkness seems to lean in, hungry.",
        ]
  );

  const base = flavor(raw) || pick(FALLBACKS).replace("%w", firstWord(raw)).replace("%v", firstWord(raw));
  return { reply: base + warning, state: next, sound: "warn" };
}
