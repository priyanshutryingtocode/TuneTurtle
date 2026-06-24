import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import logo from './assets/logo.png';
import FloatingChatAssistant from './components/FloatingChatAssistant';

// Import our new extracted components
import SearchSection from './components/SearchSection';
import AlbumCard from './components/AlbumCard';
import AnalyticsCard from './components/AnalyticsCard';
import TrackDetailsCard from './components/TrackDetailsCard';
import LyricsCard from './components/LyricsCard';

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

  const resultsRef = useRef(null);
  const initialSearchRef = useRef(false);

  const handleSearch = (e) => {
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
      item.artist.toLowerCase() !== artist.toLowerCase() ||
      item.song.toLowerCase() !== song.toLowerCase()
    ));
    const nextSearches = [nextSearch, ...filtered].slice(0, 5);

    setRecentSearches(nextSearches);
    localStorage.setItem('tuneturtle:recent-searches', JSON.stringify(nextSearches));
  }, [recentSearches]);

  const fetchAnalysis = useCallback(async (artist, song) => {
    setLoading(true);
    setError(null);
    setData(null);
    setInput({ artist, song });

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_URL}/api/analyze`, { artist, song });
      setData(res.data);
      rememberSearch(res.data.track.artist, res.data.track.song);

      const params = new URLSearchParams({
        artist: res.data.track.artist,
        song: res.data.track.song
      });
      window.history.replaceState(null, '', `?${params.toString()}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not analyze song. Please check spelling.');
    } finally {
      setLoading(false);
    }
  }, [rememberSearch]);

  const resetSearch = () => {
    setData(null);
    setError(null);
    setInput({ artist: '', song: '' });
    window.history.replaceState(null, '', window.location.pathname);
  };

  const getThemeClass = () => {
    if (!data) return "";
    const score = data.analysis.score;
    if (score >= 4) return "theme-happy";
    if (score <= -4) return "theme-sad";
    return "";
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

      <SearchSection
        input={input}
        setInput={setInput}
        handleSearch={handleSearch}
        recentSearches={recentSearches}
        fetchAnalysis={fetchAnalysis}
        loading={loading}
        error={error}
        loadingStep={loadingStep}
        loadingMessages={loadingMessages}
        hasData={!!data}
      />

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
              <AlbumCard
                track={data.track}
                analysisSummary={analysisSummary}
                copyText={copyText}
                copiedAction={copiedAction}
              />
              <AnalyticsCard
                analysis={data.analysis}
                track={data.track}
                lyricsStats={lyricsStats}
                fetchAnalysis={fetchAnalysis}
              />
              <TrackDetailsCard
                track={data.track}
                resetSearch={resetSearch}
              />
            </div>

            <div className="right-panel">
              <LyricsCard
                lyrics={data.lyrics}
                lyricsStats={lyricsStats}
                copyText={copyText}
                copiedAction={copiedAction}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data && <FloatingChatAssistant lyrics={data.lyrics} track={data.track} />}
    </div>
  );
}

export default App;