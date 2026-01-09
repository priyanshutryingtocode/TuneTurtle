import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // For Animations
import { PieChart, Pie, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Search, Music, AlertCircle, Sparkles } from 'lucide-react';
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

  const getChartData = () => {
    if (!data) return [];
    return [
      { name: 'Positive', value: data.analysis.positive_words.length, fill: '#4ade80' },
      { name: 'Negative', value: data.analysis.negative_words.length, fill: '#f87171' },
    ];
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
  <     img src={logo} alt="TuneTurtle Logo" className="logo-img" />
      </header>
      {/* Search Section */}
      <div className="search-container">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          Analyze the Vibe
        </motion.h1>
        
        <form onSubmit={analyzeSong} className="search-box glass">
          <input 
            placeholder="Artist Name" 
            value={input.artist}
            onChange={(e) => setInput({...input, artist: e.target.value})} 
          />
          <input 
            placeholder="Song Title" 
            value={input.song}
            onChange={(e) => setInput({...input, song: e.target.value})} 
          />
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

                <div className="word-stat">
                  <h4>Sentiment Balance</h4>
                  <ResponsiveContainer width="100%" height={60}>
                      <BarChart layout="vertical" data={getChartData()}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={60} style={{ fill: '#eee', fontSize: '12px' }}/>
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#333', border: 'none'}}/>
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Lyrics with "Mask" Effect */}
            <div className="right-panel">
              <div className="card lyrics-card glass-panel">
                <div className="lyrics-header">
                  <h3>Lyrics</h3>
                  <div className="badge-container">
                      <span className="badge positive">{data.analysis.positive_words.length} Positive</span>
                      <span className="badge negative">{data.analysis.negative_words.length} Negative</span>
                  </div>
                </div>
                
                <div className="lyrics-scroller">
                   <pre className="lyrics-text">{data.lyrics}</pre>
                </div>
                
                {/* Fade masks for cool scrolling effect */}
                <div className="fade-mask-top"></div>
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