import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import { Search, AlertCircle, Sparkles, User, Disc } from 'lucide-react';
import './App.css';
import logo from './assets/logo.png';

function App() {
  const [input, setInput] = useState({ artist: '', song: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeSong = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      const res = await axios.post('http://localhost:5000/api/analyze', input);
      setData(res.data);
    } catch (err) {
      setError("Could not analyze song. Please check spelling.");
    } finally {
      setLoading(false);
    }
  };

  const getScorePercentage = () => {
    if (!data) return 50;
    const rawScore = data.analysis.score;
    const clamped = Math.max(-10, Math.min(10, rawScore)); 
    return ((clamped + 10) / 20) * 100;
  };

  const gaugeData = data ? [
    { name: 'Score', value: getScorePercentage(), fill: getScorePercentage() > 50 ? '#4ade80' : '#f87171' },
    { name: 'Gray', value: 100 - getScorePercentage(), fill: 'rgba(255,255,255,0.1)' }
  ] : [];

  return (
    <div className="app-container">
      {/* 1. DYNAMIC BACKGROUND LAYER */}
      <div 
        className="ambient-background" 
        style={{ backgroundImage: data ? `url(${data.track.image})` : 'none' }}
      />
      <div className="overlay-gradient"></div>

      {/* Navbar */}
      <header className="navbar">
        <img src={logo} alt="TuneTurtle Logo" className="logo-img" />
      </header>

      {/* Search Section */}
      <div className="search-container">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          Analyze any Song
        </motion.h1>

        {/* New Subtitle */}
        <motion.p 
          className="subtitle"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Discover the hidden meaning behind your favorite tracks.
        </motion.p>
        
        <form onSubmit={analyzeSong} className="search-box glass">
          
          {/* ARTIST INPUT GROUP */}
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input 
              placeholder="Artist Name" 
              value={input.artist}
              onChange={(e) => setInput({...input, artist: e.target.value})} 
            />
          </div>

          <div className="divider"></div>

          {/* SONG INPUT GROUP */}
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

      {/* Main Dashboard Grid */}
      <AnimatePresence>
        {data && (
          <motion.div 
            className="dashboard-grid"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            
            {/* LEFT COLUMN: Metadata & Analytics */}
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
                
                {/* Chart Section */}
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

                {/* Meaning Section */}
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
              </div>
            </div>

            {/* RIGHT COLUMN: Lyrics with "Mask" Effect */}
            <div className="right-panel">
              <div className="card lyrics-card glass-panel">
                <div className="lyrics-header">
                  <h3>Lyrics</h3>
                </div>
                
                <div className="lyrics-scroller">
                   <pre className="lyrics-text">{data.lyrics}</pre>
                </div>
                
                {/* Fade masks for cool scrolling effect */}
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