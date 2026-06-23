# INFOCOMMIE

> It is pitch black. You are likely to be erased by the Crimson Tide.

The landing page for **INFOCOMMIE** — a collective of imps that liberates the
people's lost classics from the corporate vaults and restores them to the
masses (first out: *Return to Zork — The INFOCOMMIE "Toasty!" Edition*), and
forges its own original interactive fiction.

The site itself is a React SPA: a Soviet-agitprop BBS front whose flagship
original production, **SPY GAME**, runs on a black screen with a blinking
cursor — commands typed like an old-school interactive-fiction console.

> 📈 Business strategy, monetization plan, and the all-important copyright/IP
> risk map live in **[BUSINESS.md](BUSINESS.md)**.

## Play

- `feel around` — grope the dark for something useful
- `take lamp` → `light lamp` — evade the Crimson Tide and reveal the way out
- `go west` — escape into daylight (you win)
- ...or just flail and get erased by the Crimson Tide
- `restart` — back into the dark
- `help` — list the verbs that matter

Anything else gets a witty, spy-tinted non-answer. There's a `[ sound: on/off ]`
toggle in the top-right (Web Audio, no asset files).

## Stack

- React 18 + Vite
- A small hand-rolled parser (`src/game.js`) — no chatbot library; an ordered
  list of regex rules with a real win/death state machine underneath.
- `src/sound.js` — oscillator-based sound bank (keystroke blips, alarm sting,
  victory chime).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```
