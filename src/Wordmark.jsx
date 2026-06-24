/* ── INFOCOMMIE wordmark ──────────────────────────────────────────────
   Hand-built homage to the classic INFOCOM logo: heavy, geometric letters
   with rounded caps/joins. Each glyph is drawn from thick strokes on a
   100-tall grid (top 12 → bottom 88), so the lettering scales crisply and
   recolors via `currentColor`. */

const STROKE = 22;

// Per-glyph advance width + stroke paths (drawn in a 0..w × 0..100 box).
const GLYPHS = {
  I: { w: 26, d: ["M13 12 L13 88"] },
  N: { w: 52, d: ["M12 88 L12 12 L40 88 L40 12"] },
  F: { w: 52, d: ["M12 12 L12 88", "M12 12 L40 12", "M12 50 L36 50"] },
  O: { w: 64, o: { cx: 32, cy: 50, rx: 20, ry: 38 } },
  C: { w: 60, d: ["M46 18 A20 38 0 1 0 46 82"] },
  M: { w: 56, d: ["M12 88 L12 12 L28 44 L44 12 L44 88"] },
  E: { w: 52, d: ["M12 12 L12 88", "M12 12 L38 12", "M12 50 L34 50", "M12 88 L38 88"] },
};

const WORD = "INFOCOMMIE";
const GAP = 6;

export default function Wordmark({ className }) {
  let x = 0;
  const groups = [...WORD].map((ch, i) => {
    const g = GLYPHS[ch];
    const tx = x;
    x += g.w + GAP;
    return (
      <g key={i} transform={`translate(${tx} 0)`}>
        {g.o ? (
          <ellipse cx={g.o.cx} cy={g.o.cy} rx={g.o.rx} ry={g.o.ry} fill="none" />
        ) : (
          g.d.map((d, j) => <path key={j} d={d} fill="none" />)
        )}
      </g>
    );
  });
  const total = x - GAP;

  return (
    <svg
      className={className}
      viewBox={`-3 -3 ${total + 6} 106`}
      role="img"
      aria-label="INFOCOMMIE"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {groups}
    </svg>
  );
}
