import { Check, Clipboard, Share2 } from 'lucide-react';

export default function AlbumCard({ track, analysisSummary, copyText, copiedAction }) {
  return (
    <div className="card album-card glass-panel">
      <img src={track.image} alt="Album Art" className="album-art" />
      <div className="track-info">
        <h2>{track.song}</h2>
        <p>{track.artist}</p>
      </div>
      <div className="album-actions">
        <button type="button" onClick={() => copyText(analysisSummary, 'summary')}>
          {copiedAction === 'summary' ? <Check size={16} /> : <Clipboard size={16} />}
          {copiedAction === 'summary' ? 'Copied' : 'Copy summary'}
        </button>
        <button type="button" onClick={() => copyText(window.location.href, 'link')}>
          {copiedAction === 'link' ? <Check size={16} /> : <Share2 size={16} />}
          {copiedAction === 'link' ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}