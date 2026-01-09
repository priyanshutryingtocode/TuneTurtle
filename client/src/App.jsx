import { useState } from 'react';
import axios from 'axios';
import './App.css';

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
      // Connect to your new Express backend
      const res = await axios.post('http://localhost:5000/api/analyze', input);
      setData(res.data);
    } catch (err) {
      setError("Could not analyze song. Please check spelling.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🎵 TuneTurtle Analytics</h1>
      
      <form onSubmit={analyzeSong} className="search-box">
        <input 
          placeholder="Artist (e.g. Coldplay)" 
          onChange={(e) => setInput({...input, artist: e.target.value})} 
        />
        <input 
          placeholder="Song (e.g. Yellow)" 
          onChange={(e) => setInput({...input, song: e.target.value})} 
        />
        <button disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Song'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {data && (
        <div className="results">
          <div className="card vibe-card">
            <h2>Vibe Check: {data.analysis.vibe}</h2>
            <p>Sentiment Score: <strong>{data.analysis.score}</strong></p>
            <div className="word-clouds">
              <p>🟢 Positive: {data.analysis.positive_words.join(', ') || "None"}</p>
              <p>🔴 Negative: {data.analysis.negative_words.join(', ') || "None"}</p>
            </div>
          </div>

          <div className="card lyrics-card">
            <h3>Lyrics</h3>
            <pre>{data.lyrics}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;