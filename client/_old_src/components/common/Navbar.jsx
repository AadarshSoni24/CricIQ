import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <NavLink to="/" className="navbar-logo">
          <span className="logo-icon">🏏</span>
          <span className="logo-text gradient-text">CricIQ</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink to="/predict" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🎯</span> Predictor
          </NavLink>
          <NavLink to="/scout" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">👤</span> Scout
          </NavLink>
          <NavLink to="/auction" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">💰</span> Auction
          </NavLink>
          <NavLink to="/matchup" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">⚔️</span> Matchup
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
