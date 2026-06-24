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

## Accounts + Forum (Supabase)

**ENLIST** (menu 5) is real email/passphrase signup and **FORUM** (menu F) is a
shared message board (ECHOMAIL), both backed by [Supabase](https://supabase.com).
Anyone may read the board; only enlisted comrades may post (enforced by Row
Level Security). Without keys configured, both screens degrade to an "offline"
notice and the rest of the BBS works unchanged.

**One-time setup:**

1. Create a free Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) (creates
   `profiles` / `threads` / `posts` tables + RLS policies).
3. *(Optional, for instant signup)* Dashboard → Authentication → Providers →
   Email → turn **off** "Confirm email". Leave it on and new comrades must click
   a confirmation link before logging in.
4. Local dev: `cp .env.example .env.local` and fill in `VITE_SUPABASE_URL` +
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
5. Production: add those same two as **GitHub Actions secrets** (repo Settings →
   Secrets and variables → Actions). The deploy workflow inlines them at build.

The anon key is meant to be public — RLS, not key secrecy, protects the data.
