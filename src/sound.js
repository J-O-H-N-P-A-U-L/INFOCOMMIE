/*
 * Tiny Web Audio sound bank — no audio files, just oscillators.
 * Browsers block audio until a user gesture, so the AudioContext is created
 * lazily on the first keypress (which is itself a gesture).
 */
let ctx = null;
let muted = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(v) {
  muted = v;
}
export function isMuted() {
  return muted;
}

// One short tone.
function tone(freq, dur, type = "square", gain = 0.04, when = 0) {
  const ac = ensure();
  if (!ac || muted) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// A descending growl-ish noise for the grue.
function growl() {
  const ac = ensure();
  if (!ac || muted) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.7);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.09, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  // a little vibrato wobble
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.setValueAtTime(18, t);
  lfoGain.gain.setValueAtTime(14, t);
  lfo.connect(lfoGain).connect(osc.frequency);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.85);
  lfo.stop(t + 0.85);
}

export const sfx = {
  type() {
    tone(660 + Math.random() * 80, 0.03, "square", 0.02);
  },
  enter() {
    tone(440, 0.05, "square", 0.03);
  },
  warn() {
    tone(180, 0.12, "sawtooth", 0.05);
    tone(140, 0.16, "sawtooth", 0.04, 0.08);
  },
  lamp() {
    // bright rising arpeggio
    tone(523, 0.08, "triangle", 0.05, 0);
    tone(659, 0.08, "triangle", 0.05, 0.08);
    tone(784, 0.12, "triangle", 0.05, 0.16);
  },
  win() {
    tone(523, 0.1, "triangle", 0.06, 0);
    tone(659, 0.1, "triangle", 0.06, 0.1);
    tone(784, 0.1, "triangle", 0.06, 0.2);
    tone(1047, 0.25, "triangle", 0.06, 0.3);
  },
  death() {
    growl();
  },
};

export function play(kind) {
  if (sfx[kind]) sfx[kind]();
}
