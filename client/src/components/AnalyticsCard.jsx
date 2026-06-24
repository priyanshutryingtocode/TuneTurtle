import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import { Sparkles, Disc } from 'lucide-react';

export default function AnalyticsCard({ analysis, track, lyricsStats, fetchAnalysis }) {
  const getScorePercentage = () => {
    const rawScore = analysis.score;
    const clamped = Math.max(-10, Math.min(10, rawScore));
    return ((clamped + 10) / 20) * 100;
  };

  const getMoodLabel = () => {
    const score = analysis.score;
    if (score >= 6) return 'Bright';
    if (score >= 2) return 'Warm';
    if (score <= -6) return 'Heavy';
    if (score <= -2) return 'Melancholy';
    return 'Balanced';
  };

  const scorePercentage = getScorePercentage();
  const gaugeData = [
    { name: 'Score', value: scorePercentage, fill: scorePercentage > 50 ? '#4ade80' : '#f87171' },
    { name: 'Gray', value: 100 - scorePercentage, fill: 'rgba(255,255,255,0.1)' }
  ];

  return (
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
              startAngle={180} endAngle={0}
              innerRadius={60} outerRadius={80}
              dataKey="value" stroke="none"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="score-label">
          <span className="big-score">{analysis.score}</span>
          <span className="vibe-text">{analysis.vibe}</span>
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
          <p>"{analysis.meaning}"</p>
        </div>

        <div className="themes-list">
          {analysis.themes?.map((theme, i) => (
            <span key={i} className="theme-tag">#{theme}</span>
          ))}
        </div>
      </div>

      {analysis.recommendations && (
        <div className="recommendations-section">
          <h4>Similar Vibe</h4>
          <div className="rec-list">
            {analysis.recommendations
              .filter(rec => rec.song.toLowerCase() !== track.song.toLowerCase())
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
  );
}