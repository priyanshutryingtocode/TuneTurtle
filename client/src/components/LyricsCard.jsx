import { Check, Music2 } from 'lucide-react';

export default function LyricsCard({ lyrics, lyricsStats, copyText, copiedAction }) {
  return (
    <div className="card lyrics-card glass-panel">
      <div className="lyrics-header">
        <div>
          <h3>Lyrics</h3>
          <span>{lyricsStats.lines} lines captured</span>
        </div>
        <button
          type="button"
          className="lyrics-copy-btn"
          onClick={() => copyText(lyrics, 'lyrics')}
        >
          {copiedAction === 'lyrics' ? <Check size={16} /> : <Music2 size={16} />}
          {copiedAction === 'lyrics' ? 'Copied' : 'Copy lyrics'}
        </button>
      </div>

      <div className="lyrics-scroller">
        <pre className="lyrics-text">{lyrics}</pre>
      </div>

      <div className="fade-mask-bottom"></div>
    </div>
  );
}