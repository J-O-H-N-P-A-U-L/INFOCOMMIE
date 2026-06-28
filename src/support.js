/*
 * INFOCOMMIE — passive-income config (the "keep the lamps lit" fund).
 *
 * Fill in a value below and its button lights up across the site. Leave it ""
 * and it stays hidden — NO DEAD LINKS EVER SHIP. This is the only file you edit
 * to turn money on.
 *
 * ── THE FIREWALL (BUSINESS.md §2 — read before changing anything) ──
 * Money must NEVER touch a restoration. That non-commercial line is our legal
 * shield. So:
 *   • Affiliate links send buyers to the GAME'S OWN MAKERS (this literally
 *     enacts "every game belongs to its makers" — it's the safest dollar).
 *   • The TIP JAR funds our ORIGINAL work — SPY GAME, the engine, this board —
 *     never the restoration. Keep the framing about the originals.
 *   • MERCH is our ORIGINAL agitprop art only. Never merch a restoration.
 *   • Restoration playthroughs stay UNMONETIZED on YouTube (no Partner ads).
 *     The channel earns later on original content; the site funnels the subs.
 */

// ── Existing channels (real, live now — no account setup needed) ──────────
export const CHANNELS = {
  youtube: "https://www.youtube.com/@INFOCOMMIE",
  // sub_confirmation=1 pops the "Subscribe?" dialog straight away.
  youtubeSub: "https://www.youtube.com/@INFOCOMMIE?sub_confirmation=1",
  twitch: "https://www.twitch.tv/infocommie",
};

// ── Streams you turn on by pasting an ID/URL ──────────────────────────────
export const SUPPORT = {
  // TIP JAR — fill ONE (first non-empty wins). Frame it as funding the originals.
  kofi: "", //            handle only, e.g. "infocommie"  → ko-fi.com/infocommie
  buymeacoffee: "", //    handle only, e.g. "infocommie"  → buymeacoffee.com/infocommie
  githubSponsors: "", //  username,    e.g. "J-O-H-N-P-A-U-L" → github.com/sponsors/...

  // MERCH — your print-on-demand storefront (original art only). Full URL.
  store: "", //           e.g. "https://infocommie.threadless.com"
};

// First filled tip-jar option wins; "" if none set yet.
export function tipUrl() {
  if (SUPPORT.kofi) return `https://ko-fi.com/${SUPPORT.kofi}`;
  if (SUPPORT.buymeacoffee) return `https://www.buymeacoffee.com/${SUPPORT.buymeacoffee}`;
  if (SUPPORT.githubSponsors) return `https://github.com/sponsors/${SUPPORT.githubSponsors}`;
  return "";
}

export const storeUrl = () => SUPPORT.store || "";
