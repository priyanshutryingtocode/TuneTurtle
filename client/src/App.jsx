import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import { Search, AlertCircle, Sparkles, User, Disc, Calendar, Mic2, ExternalLink, PenTool, Library} from 'lucide-react';
import './App.css';
import logo from './assets/logo.png';

function App() {
  const [input, setInput] = useState({ artist: '', song: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  

  const handleSearch = (e) => 
  {
    e.preventDefault();
    fetchAnalysis(input.artist, input.song);
  };

  const fetchAnalysis = async (artist, song) => 
  {
    setLoading(true);
    setError(null);
    setData(null);
    setInput({ artist, song }); 

    try 
    {
      const res = await axios.post('http://localhost:5000/api/analyze', { artist, song });
      setData(res.data);
    } catch (err) 
    {
      setError("Could not analyze song. Please check spelling.");
    } finally 
    {
      setLoading(false);
    }
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

  const gaugeData = data ? [
    { name: 'Score', value: getScorePercentage(), fill: getScorePercentage() > 50 ? '#4ade80' : '#f87171' },
    { name: 'Gray', value: 100 - getScorePercentage(), fill: 'rgba(255,255,255,0.1)' }
  ] : [];

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoString).toLocaleDateString('en-US', options);
  };

  const resultsRef = useRef(null);

  useEffect(() => {
    if (data && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [data]);

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

          <button disabled={loading}>
            {loading ? <div className="spinner"></div> : <Search size={20} />}
          </button>
        </form>
        
        {error && <div className="error-msg"><AlertCircle size={16}/> {error}</div>}
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
                </div>
              </div>

            </div>

            <div className="right-panel">
              <div className="card lyrics-card glass-panel">
                <div className="lyrics-header">
                  <h3>Lyrics</h3>
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