import {
  PLAYLIST,
  VIDEOS,
  videoUrl,
  thumb,
  ownLinks,
  OWN_THE_ORIGINAL,
} from "./showcase.js";
import { CHANNELS, tipUrl, storeUrl } from "./support.js";
import StatusBar from "./StatusBar.jsx";

const ext = { target: "_blank", rel: "noopener noreferrer" };

/* ── WATCH — the showcase: playthroughs on real MT-32, straight from the
   INFOCOMMIE YouTube playlist. Thumbnails + blurbs link out to each video. */
export default function Showcase({ onBack }) {
  return (
    <div className="showcase">
      <header className="showcase-head">
        <div className="showcase-kicker">THE SHOWCASE · ON REAL ROLAND MT-32</div>
        <h1 className="showcase-title">{PLAYLIST.title}</h1>
        <p className="showcase-sub">
          Full playthroughs of the golden-age classics, scored on genuine MT-32
          hardware. We bring the playthrough; the makers get the credit.
        </p>
        <div className="showcase-actions">
          <a className="cta cta-red" href={PLAYLIST.url} {...ext}>
            ▶ WATCH THE FULL PLAYLIST
          </a>
          <a className="cta cta-line" href={CHANNELS.youtubeSub} {...ext}>
            ★ SUBSCRIBE ON YOUTUBE
          </a>
          <a className="cta cta-line" href={CHANNELS.twitch} {...ext}>
            ◉ FOLLOW ON TWITCH
          </a>
        </div>
      </header>

      <div className="video-grid">
        {VIDEOS.map((v) => (
          <a
            key={v.id}
            className="vcard"
            href={videoUrl(v.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="vthumb">
              <img src={thumb(v.id)} alt={v.title} loading="lazy" />
              <span className="vplay" aria-hidden="true" />
              <span className="vdur">{v.dur}</span>
            </div>
            <div className="vbody">
              <h2 className="vtitle">{v.title}</h2>
              <p className="vblurb">{v.blurb}</p>
              <span className="vwatch">WATCH ▸</span>
            </div>
          </a>
        ))}
      </div>

      {ownLinks().length > 0 && (
        <section className="own-original">
          <div className="own-kicker">OWN THE ORIGINAL</div>
          <p className="own-sub">
            We only bring the playthrough — {OWN_THE_ORIGINAL.title} belongs to
            its makers.
            Do the right thing and grab a legit copy from the source:
          </p>
          <div className="own-links">
            {ownLinks().map((l) => (
              <a key={l.store} className="cta cta-line" href={l.url} {...ext}>
                {l.store} ▸
              </a>
            ))}
          </div>
        </section>
      )}

      {(tipUrl() || storeUrl()) && (
        <section className="support-bar">
          <span className="support-label">KEEP THE LAMPS LIT —</span>
          {tipUrl() && (
            <a className="cta cta-green" href={tipUrl()} {...ext}>
              ♥ TIP THE COLLECTIVE
            </a>
          )}
          {storeUrl() && (
            <a className="cta cta-line" href={storeUrl()} {...ext}>
              ▮ AGITPROP STORE
            </a>
          )}
        </section>
      )}

      <div className="page-foot">— all games belong to their makers —</div>

      <StatusBar onMenu={onBack} hint="◄ MENU · or ESC to return" />
    </div>
  );
}
