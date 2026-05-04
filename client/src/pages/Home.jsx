import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  const stats = [
    { value: '1,175+', label: 'IPL Matches', icon: '🏏' },
    { value: '279K+', label: 'Deliveries', icon: '📊' },
    { value: '17', label: 'Seasons', icon: '📅' },
    { value: '55', label: 'ML Features', icon: '🧠' },
  ];

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-glow"></div>
          <h1 className="hero-title">
            <span className="gradient-text">CricIQ</span>
          </h1>
          <p className="hero-subtitle">
            AI-Powered IPL Intelligence Platform
          </p>
          <p className="hero-desc">
            Match predictions, franchise-grade scouting, and auction intelligence — 
            powered by 17 seasons of ball-by-ball data and ensemble ML models.
          </p>

          <div className="hero-search">
            <SearchBar placeholder="Search any IPL player..." />
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/predict')}>
              🔮 Predict a Match
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/scout')}>
              👤 Scout Players
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/auction')}>
              💰 Auction Intel
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-hero-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="stat-hero-icon">{s.icon}</span>
              <span className="stat-hero-value">{s.value}</span>
              <span className="stat-hero-label">{s.label}</span>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="features-grid">
          <div className="feature-card" onClick={() => navigate('/predict')}>
            <div className="feature-icon">🎯</div>
            <h3>Match Predictor</h3>
            <p>XGBoost + LightGBM ensemble with 55 features. SHAP-explained predictions with venue, form, and matchup context.</p>
          </div>
          <div className="feature-card" onClick={() => navigate('/scout')}>
            <div className="feature-icon">👤</div>
            <h3>Player Scout</h3>
            <p>40+ metric scouting profiles. Phase SR, spin/pace splits, intent scores, consistency indices, and T20 archetypes.</p>
          </div>
          <div className="feature-card" onClick={() => navigate('/auction')}>
            <div className="feature-icon">💰</div>
            <h3>Auction Intelligence</h3>
            <p>AI-driven bid recommendations, squad builder with budget tracking, and archetype-based valuation models.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="home-footer">
          <p>CricIQ · Built on 1,175 IPL matches · 279,586 deliveries · 2008–2026</p>
          <p>XGBoost + LightGBM Ensemble · 55 Features · SHAP Explained</p>
        </footer>
      </div>
    </div>
  );
}
