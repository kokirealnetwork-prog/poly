import { JacketCover } from "@/components/jacket-cover";

export default function Home() {
  return (
    <main className="player-shell">
      <div className="player">
        <header className="player-home-label">
          <span>HOME</span>
          <span className="player-home-rule" aria-hidden />
        </header>

        <div className="player-stage">
          <JacketCover />
        </div>

        <div className="player-meta">
          <button type="button" className="player-chevron" aria-label="Previous">
            ‹
          </button>
          <div className="player-copy">
            <p className="player-title">Slow Bright</p>
            <p className="player-artist">OWN</p>
          </div>
          <button type="button" className="player-chevron" aria-label="Next">
            ›
          </button>
        </div>

        <footer className="player-actions">
          <button type="button" className="player-fav" aria-label="Favorite">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
              <path
                d="M12 20s-7-4.4-7-9.2C5 7.5 7.2 5.5 9.4 5.5c1.3 0 2.4.6 2.6 1.5.2-.9 1.3-1.5 2.6-1.5C16.8 5.5 19 7.5 19 10.8 19 15.6 12 20 12 20z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button type="button" className="player-listen">
            <span>LISTEN</span>
          </button>
        </footer>
      </div>
    </main>
  );
}
