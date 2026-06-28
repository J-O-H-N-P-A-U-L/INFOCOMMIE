// The INFOCOMMIE showcase — restored-classic playthroughs on real MT-32 iron.
// Data for the WATCH page. Thumbnails are pulled live from YouTube's CDN.

export const PLAYLIST = {
  title: 'Return to Zork — The INFOCOMMIE "Toasty!" Edition',
  id: "PLCWXlt9qbfZs",
  url: "https://www.youtube.com/playlist?list=PLCWXlt9qbfZs",
};

export const VIDEOS = [
  {
    id: "kB-DVALa-YI",
    title: "The Rise and Fall of Zork (edited by Mavis Peepers)",
    dur: "5:25:44",
    blurb:
      "The big one. Five and a half hours of Return to Zork, scored live on a " +
      "genuine Roland MT-32 — no emulation, no soundfonts, no compromises. The " +
      "full descent into the dark, narrated and unhurried. It is pitch black; " +
      "you know how this ends.",
  },
  {
    id: "eHefbcIZJsU",
    title: "The Return of Evil by Rebecca Snoot",
    dur: "1:59:03",
    blurb:
      "Two hours deep on real MT-32 hardware — a glorious half-run that makes it " +
      "impressively far before the oldest law of the genre catches up. You are " +
      "likely to be eaten by a grue.",
  },
];

// OWN THE ORIGINAL — affiliate "buy it from the makers" links. This is the
// firewall-safe earner: it sends viewers to the rights holder (and pays us a
// small cut), reinforcing "every game belongs to its makers". Paste your own
// affiliate-tracked URLs (any network — GOG, Amazon Associates, etc.). Any link
// left "" is hidden; the whole block disappears if none are filled.
export const OWN_THE_ORIGINAL = {
  title: "Return to Zork",
  links: [
    { store: "GOG", url: "" }, // paste your GOG affiliate link
    { store: "Amazon", url: "" }, // paste your Amazon Associates link
  ],
};

export const ownLinks = () => OWN_THE_ORIGINAL.links.filter((l) => l.url);

export const videoUrl = (id) =>
  `https://www.youtube.com/watch?v=${id}&list=${PLAYLIST.id}`;

// hqdefault always exists; a 16:9 crop (object-fit: cover) hides its 4:3 bars.
export const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
