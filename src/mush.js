/*
 * mush.js — the shared hallucination.
 *
 * A small MUSH world layered over the STATE SECURITY ARCHIVE: a handful of
 * rooms comrades can walk between and meet in. This file is the pure world
 * model (rooms, exits, descriptions, movement parsing). The live multiplayer
 * wiring — Supabase Realtime presence + broadcast — lives in Mush.jsx.
 */

export const START_ROOM = "lobby";

// Single-letter and longhand direction words map to canonical exit keys.
const DIR_ALIASES = {
  n: "north", s: "south", e: "east", w: "west", u: "up", d: "down",
  north: "north", south: "south", east: "east", west: "west", up: "up", down: "down",
};

export const OPPOSITE = {
  north: "south", south: "north", east: "west", west: "east", up: "below", down: "above",
};

export const ROOMS = {
  lobby: {
    name: "NODE 1 — THE LOBBY",
    desc:
      "A flickering ANSI lobby, the public face of INFOCOMMIE BBS. Behind the\n" +
      "welcome screen the real system breathes: the STATE SECURITY ARCHIVE. A\n" +
      "maintenance hatch in the floor drops DOWN into the dark.",
    exits: { down: "dark" },
  },
  dark: {
    name: "THE DARK CORRIDOR",
    desc:
      "Unlit partitions stretch in every direction — this is where the trace\n" +
      "daemon hunts. A ladder climbs UP to the lobby; the VAULT lies NORTH, an\n" +
      "uplink gateway EAST, and the operator REGISTRY WEST.",
    exits: { up: "lobby", north: "vault", east: "uplink", west: "registry" },
  },
  vault: {
    name: "THE VAULT · /vault/noc",
    desc:
      "Row upon row of sealed partitions. Somewhere in here sleeps THE LIST —\n" +
      "every covert operative's name. ROOT a session and COPY it. The only way\n" +
      "out is back SOUTH.",
    exits: { south: "dark" },
  },
  uplink: {
    name: "THE UPLINK · free-net gateway",
    desc:
      "A humming gateway to the free net — a hundred open nodes waiting to\n" +
      "mirror anything you LEAK. DROP CARRIER here and you vanish clean. The\n" +
      "corridor is back WEST.",
    exits: { west: "dark" },
  },
  registry: {
    name: "THE OPERATOR REGISTRY",
    desc:
      "Dead terminals scroll the handles of operators who dialed in and never\n" +
      "out. A good place to wait, and to talk. The corridor is back EAST.",
    exits: { east: "dark" },
  },
};

// Resolve a movement word (a direction OR a destination name) from `roomId`.
// Returns { dir, to } or null. `dir` is the exit taken (for arrival flavor).
export function resolveExit(roomId, word) {
  const room = ROOMS[roomId];
  if (!room || !word) return null;
  const dir = DIR_ALIASES[word] || word;
  if (room.exits[dir]) return { dir, to: room.exits[dir] };
  // Allow walking by destination name, e.g. "vault" / "uplink" / "registry".
  for (const [d, to] of Object.entries(room.exits)) {
    if (to === word || ROOMS[to]?.name.toLowerCase().includes(word)) return { dir: d, to };
  }
  return null;
}

// Build the LOOK text for a room, given the handles currently in it.
export function describeRoom(roomId, hereHandles, me) {
  const room = ROOMS[roomId];
  if (!room) return "You are nowhere. The hallucination flickers and reforms.";
  const exits = Object.keys(room.exits).join(", ") || "none";
  const others = hereHandles.filter((h) => h !== me);
  const also = others.length ? "Also here: " + others.join(", ") : "You are alone here.";
  return `${room.name}\n${room.desc}\nExits: ${exits}\n${also}`;
}
