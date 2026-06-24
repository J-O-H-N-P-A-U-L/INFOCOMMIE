/* Generative pixel-art "badge" avatars — deterministic from a seed string, so
   every comrade gets a distinct, stable emblem with no storage needed. Soviet /
   retro-gamer palettes: phosphor greens & cyans, agitprop reds & golds. An
   uploaded picture (Supabase Storage) overrides this when present. */

// FNV-1a hash → 32-bit unsigned, then an xorshift RNG seeded from it.
function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
}

const THEMES = [
  { bg: "#1a0d0d", fg: "#e23b2e", hi: "#e8c84a" }, // agitprop red + gold
  { bg: "#0d0d0d", fg: "#e8c84a", hi: "#e23b2e" }, // gold star
  { bg: "#06120a", fg: "#46d96a", hi: "#aef3c0" }, // phosphor green
  { bg: "#06100f", fg: "#36c5c5", hi: "#9af0f0" }, // cyan terminal
  { bg: "#120814", fg: "#d76ad7", hi: "#f0b8f0" }, // magenta gamer
];

// A 7×7 grid, left half mirrored → symmetric identicon. Returns themed cells.
function build(seed) {
  const r = rng(hashSeed(seed || "comrade"));
  const theme = THEMES[Math.floor(r() * THEMES.length)];
  const cells = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 4; x++) {
      // center column (3) a touch sparser so the face reads cleaner
      const on = x === 3 ? r() < 0.35 : r() < 0.5;
      if (!on) continue;
      const color = r() < 0.28 ? theme.hi : theme.fg;
      cells.push({ x, y, color });
      if (x !== 3) cells.push({ x: 6 - x, y, color });
    }
  }
  return { theme, cells };
}

export function PixelBadge({ seed, className }) {
  const { theme, cells } = build(seed);
  return (
    <svg
      className={"avatar " + (className || "")}
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="7" height="7" fill={theme.bg} />
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width="1" height="1" fill={c.color} />
      ))}
    </svg>
  );
}

/* Avatar: an uploaded image if present, else a generated badge.
   `profile` may carry { avatar_url, avatar_seed }. */
export function Avatar({ url, seed, avatarSeed = 0, className, alt }) {
  if (url) {
    return <img className={"avatar " + (className || "")} src={url} alt={alt || ""} />;
  }
  return <PixelBadge seed={`${seed || "comrade"}#${avatarSeed}`} className={className} />;
}
