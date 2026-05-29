import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Panel } from '../components/Panel';
import { RULES_LIST, formatMoney } from '../constants';

function Metric({ label, value, flag, foot, footIcon, footColor }) {
  return (
    <div className="metric">
      <div className="lab">{label}</div>
      <div className={`val${flag ? ' flag' : ''}`}>{value}</div>
      {foot && (
        <div className="foot" style={footColor ? { color: footColor } : undefined}>
          {footIcon && <Icon name={footIcon} size={12} />}
          {foot}
        </div>
      )}
    </div>
  );
}

function RuleBreakdown({ lastUpload, stats }) {
  const breakdown = lastUpload?.rule_breakdown || stats?.rule_breakdown || {};
  const total = Object.values(breakdown).reduce((s, n) => s + n, 0) || 1;

  return (
    <Panel title="Rule breakdown">
      <div className="rules">
        {RULES_LIST.map((rule) => {
          const count = breakdown[rule.key] ?? 0;
          return (
            <div className="rule-row" key={rule.key}>
              <span className="dot" style={{ background: rule.color }} />
              <div>
                <div className="nm">{rule.name}</div>
                <div className="ds">{rule.desc}</div>
              </div>
              <span className="ct">{count}</span>
              <span className="bar">
                <i style={{ width: (count / total) * 100 + '%', background: rule.color }} />
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function OverviewView({ lastUpload, stats, onOpenUser, setView }) {
  const flaggedCount = lastUpload?.flagged_count ?? stats?.total_flagged_transactions ?? 0;
  const totalTxns    = lastUpload?.total_transactions ?? null;
  const usersAffected = lastUpload
    ? lastUpload.flagged_users.length
    : (stats?.unique_flagged_users ?? 0);
  const flagRate = totalTxns
    ? ((flaggedCount / totalTxns) * 100).toFixed(1) + '%'
    : '—';

  const topUsers = lastUpload?.flagged_users?.slice(0, 5) ?? [];

  return (
    <div className="content-inner fade-up">
      <div className="page-head">
        <div>
          <h1>Batch summary</h1>
          <div className="sub">
            {lastUpload
              ? `${lastUpload.total_transactions.toLocaleString()} transactions processed · ${lastUpload.processing_time_ms.toFixed(0)} ms`
              : 'Upload a batch to see results.'}
          </div>
        </div>
        <Button variant="secondary" icon="upload" onClick={() => setView('upload')}>
          New batch
        </Button>
      </div>

      <div className="metrics">
        <Metric
          label="Flagged"
          value={flaggedCount.toLocaleString()}
          flag={flaggedCount > 0}
          foot={lastUpload ? `${lastUpload.clean_count.toLocaleString()} clean` : 'total all time'}
          footIcon="shield-check"
        />
        <Metric
          label="Transactions"
          value={totalTxns !== null ? totalTxns.toLocaleString() : (stats ? '—' : '—')}
          foot={lastUpload ? `${lastUpload.processing_time_ms.toFixed(0)} ms streamed` : 'last batch'}
          footIcon="file-json"
        />
        <Metric
          label="Users affected"
          value={usersAffected.toLocaleString()}
          foot={lastUpload ? 'in this batch' : 'all time'}
          footIcon="user-round"
        />
        <Metric
          label="Flag rate"
          value={flagRate}
          foot={lastUpload ? 'of transactions flagged' : 'no batch yet'}
          footIcon="gauge"
        />
      </div>

      <div className="two-col">
        <RuleBreakdown lastUpload={lastUpload} stats={stats} />

        <Panel
          title="Top flagged users"
          action={
            <Button variant="ghost" size="sm" onClick={() => setView('flagged')}>
              View all
            </Button>
          }
        >
          {topUsers.length === 0 ? (
            <div className="empty" style={{ padding: '32px 20px' }}>
              <Icon name="users" size={22} color="var(--fg-3)" />
              <p style={{ marginTop: 10, fontSize: 12 }}>
                {lastUpload ? 'No flagged users' : 'Upload a batch to see results'}
              </p>
            </div>
          ) : (
            <div className="rules">
              {topUsers.map((uid) => (
                <div
                  key={uid}
                  className="rule-row"
                  style={{ gridTemplateColumns: '1fr auto', cursor: 'pointer' }}
                  onClick={() => onOpenUser(uid)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar id={uid} />
                    <div>
                      <div className="nm mono" style={{ fontSize: 13 }}>{uid}</div>
                      <div className="ds">Click to view flags</div>
                    </div>
                  </div>
                  <Icon name="chevron-right" size={14} color="var(--fg-3)" />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
