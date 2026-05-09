import { formatPrice } from '../../utils/formatStats';
import { useAuctionContext } from '../../context/AuctionContext';

export default function SquadBuilder() {
  const { squad, budget, removePlayer } = useAuctionContext();
  const TOTAL_BUDGET = 12000; // 120 Cr in Lakhs
  const budgetUsed = TOTAL_BUDGET - budget;
  const budgetPct = (budgetUsed / TOTAL_BUDGET) * 100;

  const roles = squad.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Squad Builder</h3>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{squad.length}/25 Players</span>
        </div>
        
        {/* Budget Progress Bar */}
        <div style={{ background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ 
            width: `${budgetPct}%`, 
            height: '100%', 
            background: budget > 2000 ? 'var(--accent-blue)' : 'var(--danger)',
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>Spent: {formatPrice(budgetUsed)}</span>
          <span style={{ fontWeight: 800, color: budget > 2000 ? 'var(--success)' : 'var(--danger)' }}>
            Left: {formatPrice(budget)}
          </span>
        </div>
      </div>

      {/* Role Summary */}
      {squad.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {Object.entries(roles).map(([role, count]) => (
            <div key={role} className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: 10 }}>
              {role}: {count}
            </div>
          ))}
        </div>
      )}

      {squad.length === 0 ? (
        <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Search for players and add them to build your squad
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
          {squad.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.player}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {p.role} · {p.archetype}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--accent-orange)', fontWeight: 800, fontSize: 14 }}>
                  {formatPrice(p.bidRange?.recommendedLakh)}
                </span>
                <button onClick={() => removePlayer(p.player)}
                  style={{ background: 'rgba(255, 61, 61, 0.1)', color: 'var(--danger)', border: '1px solid rgba(255, 61, 61, 0.2)', borderRadius: 8, width: 28, height: 28, fontSize: 12, fontWeight: 700 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
