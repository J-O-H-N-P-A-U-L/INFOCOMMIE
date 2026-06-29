/* Shared bottom BBS status bar — the footer from SPY GAME, reused sitewide as
   the "back to menu" control in place of the old floating ◄ BACK button. */
export default function StatusBar({ onMenu, hint }) {
  return (
    <footer className="bbs-status" onClick={(e) => e.stopPropagation()}>
      <button
        className="seg inv menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          onMenu();
        }}
      >
        ◄ MENU
      </button>
      {hint && <span className="seg">{hint}</span>}
    </footer>
  );
}
