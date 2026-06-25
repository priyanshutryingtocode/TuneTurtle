import { motion, AnimatePresence } from 'framer-motion';
import { User, Disc, Search, Clock, AlertCircle } from 'lucide-react';

export default function SearchSection({
  input,
  setInput,
  handleSearch,
  recentSearches,
  fetchAnalysis,
  loading,
  error,
  loadingStep,
  loadingMessages,
  hasData
}) {
  return (
    <div className="search-container">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        Analyze any Song
      </motion.h1>

      <motion.p
        className="subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Discover the hidden meaning behind your favorite tracks.
      </motion.p>

      <form onSubmit={handleSearch} className="search-box glass">
        <div className="input-group">
          <User size={18} className="input-icon" />
          <input
            placeholder="Artist Name"
            value={input.artist}
            onChange={(e) => setInput({ ...input, artist: e.target.value })}
          />
        </div>

        <div className="divider"></div>

        <div className="input-group">
          <Disc size={18} className="input-icon" />
          <input
            placeholder="Song Title"
            value={input.song}
            onChange={(e) => setInput({ ...input, song: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !input.artist.trim() || !input.song.trim()}
          aria-label="Analyze song"
        >
          {loading ? <div className="spinner"></div> : <Search size={20} />}
        </button>
      </form>

      {recentSearches.length > 0 && !hasData && (
        <div className="recent-searches">
          <span><Clock size={15} /> Recent</span>
          <div className="recent-list">
            {recentSearches.map((item) => (
              <button
                key={`${item.artist}-${item.song}`}
                type="button"
                onClick={() => fetchAnalysis(item.artist, item.song)}
              >
                {item.song} <span>by {item.artist}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-msg">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            className="loading-panel glass-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="sound-bars" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <p>{loadingMessages[loadingStep]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}