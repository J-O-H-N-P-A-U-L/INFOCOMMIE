# INFOCOMMIE

> It is pitch black. You are likely to be eaten by a grue.

A tiny Zork-themed text-adventure landing page — a React SPA on a black screen
with a blinking cursor that accepts commands like an old-school interactive
fiction console.

## Play

- `feel around` — grope the dark for something useful
- `take lamp` → `light lamp` — banish the grue and reveal the way out
- `go west` — escape into daylight (you win)
- ...or just flail and get eaten by a grue
- `restart` — back into the dark
- `help` — list the verbs that matter

Anything else gets a witty, grue-tinted non-answer. There's a `[ sound: on/off ]`
toggle in the top-right (Web Audio, no asset files).

## Stack

- React 18 + Vite
- A small hand-rolled parser (`src/game.js`) — no chatbot library; an ordered
  list of regex rules with a real win/death state machine underneath.
- `src/sound.js` — oscillator-based sound bank (keystroke blips, grue growl,
  victory chime).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```
