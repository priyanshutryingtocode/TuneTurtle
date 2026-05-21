import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import {
  Search,
  AlertCircle,
  Sparkles,
  User,
  Disc,
  Calendar,
  Mic2,
  ExternalLink,
  PenTool,
  Library,
  Clock,
  Clipboard,
  Check,
  Share2,
  Music2,
  RotateCcw
} from 'lucide-react';
import './App.css';
import logo from './assets/logo.png';

const loadingMessages = [
  'Searching the catalog...',
  'Fetching lyrics...',
  'Reading between the lines...',
  'Finding similar vibes...'
];

function App() {
  const [input, setInput] = useState({ artist: '', song: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [copiedAction, setCopiedAction] = useState(null);

  const handleSearch = (e) => 
  {
    e.preventDefault();
    const artist = input.artist.trim();
    const song = input.song.trim();

    if (!artist || !song) {
      setError('Please enter both an artist and a song title.');
      return;
    }

    fetchAnalysis(artist, song);
  };

  const rememberSearch = useCallback((artist, song) => {
    const nextSearch = { artist, song };
    const filtered = recentSearches.filter((item) => (
      item.artist.toLowerCase() !== artist.toLowerCase()
      || item.song.toLowerCase() !== song.toLowerCase()
    ));
    const nextSearches = [nextSearch, ...filtered].slice(0, 5);

    setRecentSearches(nextSearches);
    localStorage.setItem('tuneturtle:recent-searches', JSON.stringify(nextSearches));
  }, [recentSearches]);

  const fetchAnalysis = useCallback(async (artist, song) => 
  {
    setLoading(true);
    setError(null);
    setData(null);
    setInput({ artist, song }); 

    try 
    {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_URL}/api/analyze`, { artist, song });
      setData(res.data);
      rememberSearch(res.data.track.artist, res.data.track.song);

      const params = new URLSearchParams({
        artist: res.data.track.artist,
        song: res.data.track.song
      });
      window.history.replaceState(null, '', `?${params.toString()}`);
    } catch (err) 
    {
      setError(err.response?.data?.error || 'Could not analyze song. Please check spelling.');
    } finally 
    {
      setLoading(false);
    }
  }, [rememberSearch]);

  const resetSearch = () => {
    setData(null);
    setError(null);
    setInput({ artist: '', song: '' });
    window.history.replaceState(null, '', window.location.pathname);
  };

  const getThemeClass = () => 
  {
    if (!data) return ""; 
    const score = data.analysis.score;
    if (score >= 4) return "theme-happy";
    if (score <= -4) return "theme-sad";
    return ""; 
  };

  const getScorePercentage = () => 
  {
    if (!data) return 50;
    const rawScore = data.analysis.score;
    const clamped = Math.max(-10, Math.min(10, rawScore)); 
    return ((clamped + 10) / 20) * 100;
  };

  const getMoodLabel = () => 
  {
    if (!data) return 'Balanced';
    const score = data.analysis.score;
    if (score >= 6) return 'Bright';
    if (score >= 2) return 'Warm';
    if (score <= -6) return 'Heavy';
    if (score <= -2) return 'Melancholy';
    return 'Balanced';
  };

  const gaugeData = data ? [
    { name: 'Score', value: getScorePercentage(), fill: getScorePercentage() > 50 ? '#4ade80' : '#f87171' },
    { name: 'Gray', value: 100 - getScorePercentage(), fill: 'rgba(255,255,255,0.1)' }
  ] : [];

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoString).toLocaleDateString('en-US', options);
  };

  const getLyricsStats = () => {
    if (!data?.lyrics) return { lines: 0, words: 0 };

    return {
      lines: data.lyrics.split('\n').filter((line) => line.trim()).length,
      words: data.lyrics.split(/\s+/).filter(Boolean).length
    };
  };

  const analysisSummary = data
    ? `${data.track.song} by ${data.track.artist}: ${data.analysis.vibe} (${data.analysis.score}/10). ${data.analysis.meaning}`
    : '';

  const copyText = async (text, action) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAction(action);
      setTimeout(() => setCopiedAction(null), 1800);
    } catch {
      setError('Could not copy to clipboard in this browser.');
    }
  };

  const resultsRef = useRef(null);
  const initialSearchRef = useRef(false);
  const lyricsStats = getLyricsStats();

  useEffect(() => {
    if (data && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [data]);

  useEffect(() => {
    const savedSearches = localStorage.getItem('tuneturtle:recent-searches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  useEffect(() => {
    if (initialSearchRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const artist = params.get('artist');
    const song = params.get('song');

    if (artist && song) {
      initialSearchRef.current = true;
      fetchAnalysis(artist, song);
    }
  }, [fetchAnalysis]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return undefined;
    }

    const intervalId = setInterval(() => {
      setLoadingStep((step) => (step + 1) % loadingMessages.length);
    }, 1600);

    return () => clearInterval(intervalId);
  }, [loading]);

  return (
    <div className={`app-container ${getThemeClass()}`}>
      <div 
        className="ambient-background" 
        style={{ backgroundImage: data ? `url(${data.track.image})` : 'none' }}
      />
      <div className="overlay-gradient"></div>

      <header className="navbar">
        <img src={logo} alt="TuneTurtle Logo" className="logo-img" />
      </header>

      <div className="search-container">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
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

        <div className="quick-start-row">
          {['Frank Ocean', 'Taylor Swift', 'Kendrick Lamar'].map((artist) => (
            <button
              key={artist}
              type="button"
              className="quick-chip"
              onClick={() => setInput({ artist, song: '' })}
            >
              {artist}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSearch} className="search-box glass">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input 
              placeholder="Artist Name" 
              value={input.artist}
              onChange={(e) => setInput({...input, artist: e.target.value})} 
            />
          </div>

          <div className="divider"></div>

          <div className="input-group">
            <Disc size={18} className="input-icon" />
            <input 
              placeholder="Song Title" 
              value={input.song}
              onChange={(e) => setInput({...input, song: e.target.value})} 
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

        {recentSearches.length > 0 && !data && (
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
        
        {error && <div className="error-msg"><AlertCircle size={16}/> {error}</div>}

        <AnimatePresence>
          {loading && (
            <motion.div
              className="loading-panel glass-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="sound-bars" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>{loadingMessages[loadingStep]}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {data && (
          <motion.div 
            ref={resultsRef}
            className="dashboard-grid"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            
            <div className="left-panel">
              <div className="card album-card glass-panel">
                <img src={data.track.image} alt="Album Art" className="album-art" />
                <div className="track-info">
                  <h2>{data.track.song}</h2>
                  <p>{data.track.artist}</p>
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

              <div className="card analytics-card glass-panel">
                <div className="card-header">
                  <Sparkles size={18} color="#fbbf24" />
                  <h3>AI Vibe Check</h3>
                </div>
                
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%" cy="80%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="score-label">
                    <span className="big-score">{data.analysis.score}</span>
                    <span className="vibe-text">{data.analysis.vibe}</span>
                  </div>
                </div>

                <div className="vibe-metrics">
                  <div>
                    <span>Mood</span>
                    <strong>{getMoodLabel()}</strong>
                  </div>
                  <div>
                    <span>Lines</span>
                    <strong>{lyricsStats.lines}</strong>
                  </div>
                  <div>
                    <span>Words</span>
                    <strong>{lyricsStats.words}</strong>
                  </div>
                </div>

                <div className="analysis-content">
                  <div className="meaning-box">
                    <h4>What does this song mean?</h4>
                    <p>"{data.analysis.meaning}"</p>
                  </div>

                  <div className="themes-list">
                    {data.analysis.themes?.map((theme, i) => (
                      <span key={i} className="theme-tag">#{theme}</span>
                    ))}
                  </div>
                </div>

                {data.analysis.recommendations && (
                  <div className="recommendations-section">
                    <h4>Similar Vibe</h4>
                    <div className="rec-list">
                      {data.analysis.recommendations
                        .filter(rec => rec.song.toLowerCase() !== data.track.song.toLowerCase())
                        .map((rec, i) => (
                          <div 
                            key={i} 
                            className="rec-card glass-panel"
                            onClick={() => fetchAnalysis(rec.artist, rec.song)}
                          >
                            <div className="rec-icon">
                              <Disc size={16} />
                            </div>
                            <div className="rec-info">
                              <span className="rec-song">{rec.song}</span>
                              <span className="rec-artist">{rec.artist}</span>
                              {rec.reason && <span className="rec-reason">{rec.reason}</span>}
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card details-card glass-panel">
                <div className="card-header">
                   <Disc size={18} color="#a5b4fc" />
                   <h3>Track Details</h3>
                </div>

                <div className="details-list">

                  {data.track.album && (
                    <div className="detail-row">
                      <Library size={16} className="detail-icon" />
                      <div className="detail-info">
                        <span className="label">Album</span>
                        <span className="value">{data.track.album}</span>
                      </div>
                    </div>
                  )}

                  {data.track.releaseDate && (
                    <div className="detail-row">
                      <Calendar size={16} className="detail-icon" />
                      <div className="detail-info">
                        <span className="label">Released</span>
                        <span className="value">{formatDate(data.track.releaseDate)}</span>
                      </div>
                    </div>
                  )}

                  {data.track.producers && data.track.producers.length > 0 && (
                    <div className="detail-row">
                      <Mic2 size={16} className="detail-icon" />
                      <div className="detail-info">
                        <span className="label">Produced By</span>
                        <span className="value">{data.track.producers.join(', ')}</span>
                      </div>
                    </div>
                  )}

                  {data.track.writers && data.track.writers.length > 0 && (
                    <div className="detail-row">
                      <PenTool size={16} className="detail-icon" />
                      <div className="detail-info">
                        <span className="label">Written By</span>
                        <span className="value">{data.track.writers.slice(0, 3).join(', ')}</span>
                      </div>
                    </div>
                  )}
                  
                  {!data.track.releaseDate && 
                   (!data.track.producers || data.track.producers.length === 0) && 
                   (!data.track.writers || data.track.writers.length === 0) && (
                     <div className="detail-row">
                        <div className="detail-info">
                           <span className="label" style={{ opacity: 0.5 }}>No extra metadata found</span>
                        </div>
                     </div>
                  )}
                </div>

                <div className="divider-horizontal"></div>

                <div className="links-row">
                  <a href={data.track.url} target="_blank" rel="noreferrer" className="link-btn genius-btn">
                    <span>View on Genius</span>
                    <ExternalLink size={16} />
                  </a>
                  <button type="button" className="link-btn reset-btn" onClick={resetSearch}>
                    <span>New Search</span>
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>

            </div>

            <div className="right-panel">
              <div className="card lyrics-card glass-panel">
                <div className="lyrics-header">
                  <div>
                    <h3>Lyrics</h3>
                    <span>{lyricsStats.lines} lines captured</span>
                  </div>
                  <button
                    type="button"
                    className="lyrics-copy-btn"
                    onClick={() => copyText(data.lyrics, 'lyrics')}
                  >
                    {copiedAction === 'lyrics' ? <Check size={16} /> : <Music2 size={16} />}
                    {copiedAction === 'lyrics' ? 'Copied' : 'Copy lyrics'}
                  </button>
                </div>
                
                <div className="lyrics-scroller">
                   <pre className="lyrics-text">{data.lyrics}</pre>
                </div>
                
                <div className="fade-mask-bottom"></div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
