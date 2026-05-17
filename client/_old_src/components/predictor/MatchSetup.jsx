import { useState, useEffect } from 'react';
import { fetchTeams, fetchVenues } from '../../services/api';
import { getTeamColor } from '../../utils/teamColors';
import './MatchSetup.css';

export default function MatchSetup({ onPredict, loading }) {
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [venue, setVenue] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');

  useEffect(() => {
    fetchTeams().then(t => { setTeams(t); if (t.length >= 2) { setTeam1(t[5]?.name || t[0].name); setTeam2(t[0]?.name || t[1].name); }});
    fetchVenues().then(v => { setVenues(v); if (v.length) setVenue(v[0]); });
  }, []);

  useEffect(() => { if (team1) setTossWinner(team1); }, [team1]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict({ team1, team2, venue, tossWinner, tossDecision });
  };

  const team2Options = teams.filter(t => t.name !== team1);

  return (
    <form className="match-setup" onSubmit={handleSubmit}>
      <div className="setup-row">
        <div className="form-group">
          <label className="form-label">🔵 Team 1</label>
          <input 
            list="team1-list"
            className="input" 
            placeholder="Type or select Team 1"
            value={team1} 
            onChange={(e) => setTeam1(e.target.value)}
            style={{ borderColor: `${getTeamColor(team1)}55` }}
          />
          <datalist id="team1-list">
            {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </datalist>
        </div>
        <div className="vs-badge">VS</div>
        <div className="form-group">
          <label className="form-label">🔴 Team 2</label>
          <input 
            list="team2-list"
            className="input" 
            placeholder="Type or select Team 2"
            value={team2} 
            onChange={(e) => setTeam2(e.target.value)}
            style={{ borderColor: `${getTeamColor(team2)}55` }}
          />
          <datalist id="team2-list">
            {team2Options.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </datalist>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">🏟️ Venue</label>
        <input 
          list="venue-list"
          className="input" 
          placeholder="Type or select venue"
          value={venue} 
          onChange={(e) => setVenue(e.target.value)}
        />
        <datalist id="venue-list">
          {venues.map(v => <option key={v} value={v}>{v}</option>)}
        </datalist>
      </div>

      <div className="setup-row">
        <div className="form-group">
          <label className="form-label">🪙 Toss won by</label>
          <select className="select" value={tossWinner} onChange={e => setTossWinner(e.target.value)}>
            <option value={team1}>{team1 || 'Select Team 1 first'}</option>
            <option value={team2}>{team2 || 'Select Team 2 first'}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">📋 Elected to</label>
          <select className="select" value={tossDecision} onChange={e => setTossDecision(e.target.value)}>
            <option value="bat">Bat First</option>
            <option value="field">Field First</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? '⏳ Analysing...' : '🔮 Predict Winner'}
      </button>
    </form>
  );
}
