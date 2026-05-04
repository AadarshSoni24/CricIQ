import { formatPrice } from '../../utils/formatStats';
import { useAuctionContext } from '../../context/AuctionContext';

export default function SquadBuilder() {
  const { squad, budget, removePlayer } = useAuctionContext();

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title" style={{ margin: 0 }}>Squad Builder</h3>
        <div>
          <span className="label">Remaining Budget: </span>
          <span style={{ fontSize: 20, fontWeight: 800, color: budget > 2000 ? 'var(--success)' : 'var(--danger)' }}>
            {formatPrice(budget)}
          </span>
        </div>
      </div>

      {squad.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
          Search for players and add them to build your squad
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {squad.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.player}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>{p.role} · {p.archetype}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--accent-orange)', fontWeight: 700, fontSize: 13 }}>
                  {formatPrice(p.bidRange?.recommendedLakh)}
                </span>
                <button onClick={() => removePlayer(p.player)}
                  style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        {squad.length}/25 players · Budget: ₹120Cr
      </div>
    </div>
  );
}
