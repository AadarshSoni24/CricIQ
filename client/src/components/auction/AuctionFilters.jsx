export default function AuctionFilters({ filters, onFilter }) {
  if (!filters) return null;
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 className="section-title">Filters</h3>
      <div className="grid-3">
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="select" onChange={e => onFilter('role', e.target.value)}>
            <option value="">All Roles</option>
            {filters.roles?.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tier</label>
          <select className="select" onChange={e => onFilter('tier', e.target.value)}>
            <option value="">All Tiers</option>
            {filters.tiers?.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Min Score</label>
          <input type="number" className="input" placeholder="0" min="0" max="100"
            onChange={e => onFilter('minScore', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
