import { Disc, Library, Calendar, Mic2, PenTool, ExternalLink, RotateCcw } from 'lucide-react';

export default function TrackDetailsCard({ track, resetSearch }) {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="card details-card glass-panel">
      <div className="card-header">
        <Disc size={18} color="#a5b4fc" />
        <h3>Track Details</h3>
      </div>

      <div className="details-list">
        {track.album && (
          <div className="detail-row">
            <Library size={16} className="detail-icon" />
            <div className="detail-info">
              <span className="label">Album</span>
              <span className="value">{track.album}</span>
            </div>
          </div>
        )}

        {track.releaseDate && (
          <div className="detail-row">
            <Calendar size={16} className="detail-icon" />
            <div className="detail-info">
              <span className="label">Released</span>
              <span className="value">{formatDate(track.releaseDate)}</span>
            </div>
          </div>
        )}

        {track.producers && track.producers.length > 0 && (
          <div className="detail-row">
            <Mic2 size={16} className="detail-icon" />
            <div className="detail-info">
              <span className="label">Produced By</span>
              <span className="value">{track.producers.join(', ')}</span>
            </div>
          </div>
        )}

        {track.writers && track.writers.length > 0 && (
          <div className="detail-row">
            <PenTool size={16} className="detail-icon" />
            <div className="detail-info">
              <span className="label">Written By</span>
              <span className="value">{track.writers.slice(0, 3).join(', ')}</span>
            </div>
          </div>
        )}

        {!track.releaseDate && (!track.producers || track.producers.length === 0) && (!track.writers || track.writers.length === 0) && (
          <div className="detail-row">
            <div className="detail-info">
              <span className="label" style={{ opacity: 0.5 }}>No extra metadata found</span>
            </div>
          </div>
        )}
      </div>

      <div className="divider-horizontal"></div>

      <div className="links-row">
        <a href={track.url} target="_blank" rel="noreferrer" className="link-btn genius-btn">
          <span>View on Genius</span>
          <ExternalLink size={16} />
        </a>
        <button type="button" className="link-btn reset-btn" onClick={resetSearch}>
          <span>New Search</span>
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}